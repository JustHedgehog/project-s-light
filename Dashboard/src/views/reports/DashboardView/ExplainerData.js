import React, { useEffect, useState } from "react";
import clsx from "clsx";
import PropTypes from "prop-types";
import { DataGrid } from "@mui/x-data-grid";
import { isEmpty, find } from "lodash";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  makeStyles,
  InputLabel,
  MenuItem,
  Select,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Backdrop,
} from "@material-ui/core";
import Stepper from "@material-ui/core/Stepper";
import Step from "@material-ui/core/Step";
import StepLabel from "@material-ui/core/StepLabel";
import axios from "../../../utils/addons";
import { toast } from "react-toastify";
import * as yup from "yup";
import { useFormik } from "formik";
import ShapView from "../ExplainersView/ShapView";
import LimeView from "../ExplainersView/LimeView";
import mqtt from "precompiled-mqtt";
import AnchorsView from "../ExplainersView/AnchorsView";

const useStyles = makeStyles((theme) => ({
  root: {
    "& .MuiDataGrid-columnHeaderCheckbox .MuiDataGrid-columnHeaderTitleContainer":{
      display: "none"
    }
  },
  backdrop: {
    zIndex: 2
  },
  select: {
    minWidth: 160,
  },
  grid: {
    margin: theme.spacing(1),
  },
  button: {
    marginTop: theme.spacing(2),
  },
}));

function getSteps() {
  return ["Select data", "Select model"];
}
function getStepContent(stepIndex) {
  switch (stepIndex) {
    case 0:
      return "Select the data";
    case 1:
      return "Select the model for use";
    case 2:
      return "Analyze";
    default:
      return "Unknown stepIndex";
  }
}
const columns = [
  { field: "id", headerName: "ID", width: 90 },
  {
    field: "message",
    headerName: "Message",
    id: "id",
    width: 150,
    editable: true,
    flex: 1
  },
];

const validationSchema = [
  yup.object({
    topic: yup.string("Enter the topic").required("Enter the topic"),
    range: yup.string("Enter the range").required("Enter the range"),
    selectedMessages: yup.array().min(1, "Select a message"),
  }),
  yup.object({
    explainer: yup.object().required(),
    model: yup.object().required(),
  }),
];

const ExplainerData = ({ className, ...rest }) => {
  const [id, setShapId] = React.useState(1);
  const [messages, setMessages] = React.useState([]);
  const [activeStep, setActiveStep] = React.useState(0);
  const [topic, setTopic] = React.useState();
  const [topics, setTopics] = React.useState([]);
  const [models, setModels] = React.useState([]);
  const [explainers, setExplainers] = React.useState([]);
  const [explainerResult, setExplainerResult] = React.useState("");
  const [range, setRange] = React.useState(0);
  const [shapView, setShapView] = React.useState("");
  const [selectedMessages, setSelectedMessages] = React.useState([]);
  const [selectionModel, setSelectionModel] = React.useState([]);
  const [model, setModel] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const hostIp = process.env.REACT_APP_API_GATEWAY

  const initialValues = [
    {
      topic: "",
      range: 0,
      model: "",
      explainer: "",
      selectedMessages: [],
    },
    {
      topic: "",
      range: 0,
      model: "",
      explainer: "",
      selectedMessages: [],
    },
  ];
  
  const getMessagesByDataGrid = (msgs) => {
    const msgsNames =
      msgs.map((value) => {
        const msgObj = find(messages, { id: value });
        if (msgObj) {
          return msgObj.message;
        }
      }) || [];
    return msgsNames;
  };

  const formik = useFormik({
    initialValues: initialValues[activeStep],
    validationSchema: validationSchema[activeStep],
    onSubmit: (values) => {
      if (values.selectedMessages.length) {
        handleNext();
        if (activeStep === 1) {
          console.log(values)
          const messagesNames = values.selectedMessages
          console.log(messagesNames)
          const data = {
            topic: values.topic,
            samples: messagesNames,
            explainerId: values.explainer.id,
            modelId: values.model.id,
          };
          console.log(data)
          console.log(JSON.stringify(data))
          let client = mqtt.connect(process.env.REACT_APP_MQTT_SERVER)
          client.on('connect', () => {
            client.subscribe('explainer-'+ values.explainer.name.toLowerCase() +'-visualization-info', {qos: 1}, (err) => {
              if (!err) {
                console.log("Connected with " + values.explainer.name.toLowerCase() + " microservice info")
              }
            })
            client.subscribe('explainer-'+ values.explainer.name.toLowerCase() +'-visualization-error', {qos: 1}, (err) => {
              if (!err) {
                console.log("Connected with " + values.explainer.name.toLowerCase() + " microservice error")
              }
            })
          })

          setIsLoading(true)

          axios
            .post(hostIp + ":8080/api/analysis/local", data)
            .then((res) => {
              // setExplainerResult(res.data);
              client.on('message', (topic, message) => {
                if(JSON.parse(message.toString()).analyseId === res.data){
                    if(topic === 'explainer-'+ values.explainer.name.toLowerCase() +'-visualization-error'){
                        setIsLoading(false)
                        toast.error("Error occured: " + JSON.parse(message.toString()).message)
                        client.end()
                  }else{
                    axios.get(hostIp + ':8080/api/analysis/'+ res.data).then((response) => {
                      console.log(response)
                      setExplainerResult(JSON.parse(response.data.result))
                      setIsLoading(false)
                      console.log(JSON.parse(response.data.result))
                      console.log(message.toString())
                      client.end()
                    })
                    // formik.resetForm()
                    // setAddExplainer(false)
                    // setAllExplainers((prev) => [...prev, response.data])
                  }
                }
              })
            });
        }
      } else {
        toast.error("All fields are required");
      }
    },
  });

  const checkValidation = () => {
    console.log(formik.errors);
    if (formik.errors && !isEmpty(formik.errors)) {
      toast.error("Error - all fields are required!");
    }
  };

  useEffect(() => {
    if (activeStep === 0) {
      getTopics();
    } else if (activeStep === 1) {
      getModels();
      // getExplainers();
    }
  }, [activeStep]);

  const getTopics = () => {
    axios.get(hostIp + ":8080/api/kafka/topics").then((res) => {
      setTopics(res.data);
      res.data.length && formik.setFieldValue("topic", res.data[0].id);
    });
  };
  const getMessages = (topic, range) => {
    axios
      .get(hostIp + `:8080/api/kafka/${topic}/messages?range=${range}`)
      .then((res) => {
        console.log(res)
        let i = 0;
        const msgs = res.data.map((value) => {
          i++;
          return { message: value.message, id: value.id };
        });

        setMessages(msgs ? [...msgs] : []);
        console.log(msgs)
      });
  };
  const getModels = () => {
    axios.get(hostIp + ":8080/api/models").then((res) => {
      console.log(res.data)
      setModels(res.data);
      res.data.length && formik.setFieldValue("model", res.data[0].id);
    });
  };

  const getExplainers = (model_id) => {
    axios.get(hostIp + ":8080/api/explainers", {
      params: {
        modelId: model_id
      }
    }).then((res) => {
      console.log(res.data)
      setExplainers(res.data);
      res.data.length && formik.setFieldValue("explainer", res.data[0].id);
    });
  };
  const steps = getSteps();

  const handleChange = (event) => {
    setModel(event.target.value)
    formik.setFieldValue(event.target.name, event.target.value);
    if (event.target.name === "topic") {
      setTopic(event.target.value);
      setMessages([])
      getMessages(event.target.value, 0);
    } else if (event.target.name === "range") {
      getMessages(topic, event.target.value ? event.target.value : 0);
      setRange(event.target.value);
    }
    if (event.target.name === "model") {
      getExplainers(event.target.value.id)
    }
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => {
      return prevActiveStep + 1;
    });
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    formik.resetForm();
    setMessages([]);
    setExplainerResult("");
  };


  const classes = useStyles();

  return (
    <Card className={clsx(classes.root, className)} {...rest}>
      <Backdrop
        className={clsx(classes.backdrop, className)}
        sx={{ color: "#fff" }}
        open={isLoading}
      >
        <CircularProgress />
      </Backdrop>
      <CardHeader title="Get Data" />
      <Divider />
      <CardContent>
        <Box position="relative">
          <Box>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Typography variant="h4" className={classes.instructions}>
              {getStepContent(activeStep)}
            </Typography>
            <form
              onSubmit={(event) => {
                checkValidation();
                formik.handleSubmit(event);
              }}
            >
              {Boolean(activeStep === 0) && (
                <Grid container>
                  <Grid item xs={12} className={clsx(classes.grid, className)}>
                    <InputLabel id="topic-select-label">Topic</InputLabel>
                    <Select
                      className={clsx(classes.select, className)}
                      labelId="topic-select-label"
                      id="topic-select"
                      label="Topic"
                      name="topic"
                      value={formik.values.topic}
                      onChange={handleChange}
                      error={
                        formik.touched.topic && Boolean(formik.errors.topic)
                      }
                      helpertext={formik.touched.topic && formik.errors.topic}
                    >
                      {topics && topics.length ? (
                        topics.map((topic) => (
                          <MenuItem key={topic} value={topic}>
                            {topic}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem key={"no topics"} value={"no topics"}>
                          {"No topics"}
                        </MenuItem>
                      )}
                    </Select>
                  </Grid>
                  <Grid item xs={12} className={clsx(classes.grid, className)}>
                    <InputLabel id="range-select-label">Range</InputLabel>
                    <Select
                      className={clsx(classes.select, className)}
                      labelId="range-select-label"
                      id="range-select"
                      label="Zakres"
                      name="range"
                      value={formik.values.range}
                      onChange={handleChange}
                      error={
                        formik.touched.range && Boolean(formik.errors.range)
                      }
                      helpertext={formik.touched.range && formik.errors.range}
                    >
                      <MenuItem value={10}>Last 10</MenuItem>
                      <MenuItem value={20}>Last 20</MenuItem>
                      <MenuItem value={100}>Last 100</MenuItem>
                      <MenuItem value={0}>From beginning</MenuItem>
                    </Select>
                  </Grid>
                  <Grid item className={classes.grid} xs={12}>
                    <Typography
                      color="inherit"
                      variant="h5"
                      component="h1"
                      style={{ marginBottom: "10px" }}
                    >
                      Messages
                    </Typography>
                    <div
                      style={{
                        height: 300,
                        width: "100%",
                        border:
                          formik.touched.selectedMessages &&
                            Boolean(formik.errors.selectedMessages)
                            ? "1px solid red"
                            : "none",
                      }}
                    >
                      <DataGrid
                        rows={messages}
                        columns={columns}
                        getRowId={(row) => row.message}
                        pageSize={20}
                        rowsPerPageOptions={[20]}
                        checkboxSelection
                        disableSelectionOnClick
                        
                        selectionModel={selectedMessages}
                        // onSelectionModelChange={(selected) => {
                        //   formik.setFieldValue("selectedMessages", selected);
                        //   setSelectedMessages(selected);
                        // }}
                        // if we want select only one row, use this
                        onSelectionModelChange={(selection) => {
                          if (selection.length > 1) {
                            const selectionSet = new Set(selectionModel);
                            const result = selection.filter(
                              (s) => !selectionSet.has(s)
                            );
                            formik.setFieldValue("selectedMessages", result);
                            console.log(result)
                            setSelectedMessages(result);
                            setSelectionModel(result);
                          } else {
                            formik.setFieldValue("selectedMessages", selection);
                            setSelectedMessages(selection);
                            setSelectionModel(selection);
                          }
                        }}
                        helpertext={
                          formik.touched.selectedMessages &&
                          formik.errors.selectedMessages
                        }
                      />
                    </div>
                  </Grid>
                </Grid>
              )}
              {activeStep === 1 && (
                <Grid container>
                  <Grid item xs={12} className={clsx(classes.grid, className)}>
                    <InputLabel id="topic-select-label">Model</InputLabel>
                    <Select
                      className={clsx(classes.select, className)}
                      labelId="model-select-label"
                      id="model-select"
                      label="Model"
                      displayEmpty
                      name="model"
                      value={formik.values.model}
                      onChange={handleChange}
                      error={
                        formik.touched.model && Boolean(formik.errors.model)
                      }
                      helpertext={formik.touched.model && formik.errors.model}
                    >
                      {models.length > 0 ? (
                        models.map((model) => (
                          <MenuItem key={model.id} value={model}>
                            {model.name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem key={"No models"} value={"No models"}>
                          {"No models"}
                        </MenuItem>
                      )}
                    </Select>
                  </Grid>
                  <Grid item xs={12} className={clsx(classes.grid, className)}>
                    <InputLabel id="range-select-placeholder-label-label">
                      Explainer
                    </InputLabel>
                    <Select
                      className={clsx(classes.select, className)}
                      labelId="explainer-select-placeholder-label-label"
                      id="explainer-select"
                      displayEmpty
                      label="Zakres"
                      name="explainer"
                      value={formik.values.explainer}
                      onChange={handleChange}
                      error={
                        formik.touched.explainer &&
                        Boolean(formik.errors.explainer)
                      }
                      helpertext={
                        formik.touched.explainer && formik.errors.explainer
                      }
                    >
                      {explainers.length > 0 ? (
                        explainers.map((explainer) => (
                          <MenuItem key={explainer.id} value={explainer}>
                            {explainer.name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem key={"No explainers"} value={"No explainers"}>
                          {"No explainers"}
                        </MenuItem>
                      )}
                    </Select>
                  </Grid>
                </Grid>
              )}
              {activeStep === 2 && explainerResult && (
                <Grid item xs={12}>
                  <p>Explainer name: {explainerResult.explainerName}</p>
                  <p>Model name: {explainerResult.modelName}</p>
                  <div style={{ textAlign: 'center' }}>
                    {explainerResult.explainerName === 'SHAP' && <ShapView html={explainerResult} />}
                    {explainerResult.explainerName === 'LIME' && <LimeView response={explainerResult} />}
                    {explainerResult.explainerName === 'ANCHORS' && <AnchorsView html={explainerResult}></AnchorsView>}
                  </div>
                </Grid>
              )}
              <div>
                {activeStep === steps.length ? (
                  <div className={classes.button}>
                    <Button variant="contained" onClick={handleReset}>
                      Reset
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className={classes.button}>
                      <Button
                        disabled={activeStep === 0}
                        onClick={handleBack}
                        className={classes.backButton}
                      >
                        Back
                      </Button>
                      <Button variant="contained" color="primary" type="submit">
                        {activeStep === steps.length - 1
                          ? "Analyze"
                          : "Explain"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

ExplainerData.propTypes = {
  className: PropTypes.string,
};

export default ExplainerData;

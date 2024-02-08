import { Backdrop, Box, Button, Card, CardContent, CardHeader, CircularProgress, Divider, Grid, Input, InputLabel, makeStyles, MenuItem, Select } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { DataGrid } from "@mui/x-data-grid";
import * as yup from "yup";
import axios from "axios";
import { toast } from "react-toastify";
import { isEmpty, find } from "lodash";
import { useFormik } from "formik";
import { width } from "@mui/system";
import Papa from 'papaparse'
import mqtt from "precompiled-mqtt";

const hostIp = process.env.REACT_APP_API_GATEWAY


const useStyles = makeStyles((theme) => ({
    root: {},
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

const validationSchema = [

    //LIME Tabular
    yup.object({
        name: yup.string("Enter the name").required("Enter the name"),
        model: yup.string("Enter the model content").required("Enter the model content"),
        columnNames: yup.string("Enter column names").trim().required("Enter column names"),
        inputType: yup.string("Enter input type").required("Enter input type"),
        featureNames: yup.string("Enter feature names").trim().required("Enter feature names"),
        labelColumn: yup.string("Enter column label").trim().required("Enter column name"),
        dataTrainset: yup.mixed().required("Enter data train file")
    }),
    //SHAP Tabular
    yup.object({
        name: yup.string("Enter the name").required("Enter the name"),
        model: yup.string("Enter the model content").required("Enter the model content"),
        columnNames: yup.string("Enter column names").trim().required("Enter column names"),
        inputType: yup.string("Enter input type").required("Enter input type"),
        featureNames: yup.string("Enter feature names").trim().required("Enter feature names"),
        labelColumn: yup.string("Enter column label").trim().required("Enter column name"),
        dataTrainset: yup.mixed().required("Enter data train file")
    }),
    //ANCHORST TABULAR
    yup.object({
        name: yup.string("Enter the name").required("Enter the name"),
        model: yup.string("Enter the model content").required("Enter the model content"),
        inputType: yup.string("Enter input type").required("Enter input type"),
        columnNames: yup.string("Enter column names").trim().required("Enter column names"),
        labelColumn: yup.string("Enter column label").trim().required("Enter column name"),
        featureNames: yup.string("Enter feature names").trim().required("Enter feature names"),
        dataTrainset: yup.mixed().required("Enter data train file")
    }),
];


const ManageExplainer = ({ className, ...rest }) => {

    const [allExplainers, setAllExplainers] = useState([])
    const [addExplainer, setAddExplainer] = useState(false)
    const [explainer, setExplainer] = useState("")
    const [selectionModel, setSelectionModel] = useState([])
    const [allModels, setAllModels] = useState([])
    const [model, setModel] = useState("")
    const [explainerValidationKey, setExplainerValidationKey] = useState(0)
    const [selectedFile, setSelectedFile] = useState("")
    const [fileName, setFileName] = useState("")
    const [client, setClient] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [newExplainer, setNewExplainer] = useState("huh")

    const classes = useStyles()

    const initialValues = [
        {
            name: "",
            model: "",
            inputType: "",
            columnNames: "",
            dataTrainset: "",
            featureNames: "Input Packets,Input Bytes,First switched,Src IP TOS,Output Packets,Output Bytes,Input SNMP,Output SNMP,Source ASN,Destination ASN,Source Mask,Destination Mask,Destination IP TOS,Direction,Source VLAN,Destination VLAN,cl,sl,al,Total Flow",
            categoricalFeatures: "",
            categoricalNames: "",
            labelColumn: "",
        }
    ];

    const columns = [
        { field: "id", headerName: "ID", width: 300 },
        {
            field: "name",
            headerName: "Name",
            width: 150,
        },
        {
            field: "inputType",
            headerName: "Input Type",
            width: 100,
        },
        {
            field: 'columnNames',
            headerName: 'Column Names',
            width: 100,
        },
        {
            field: 'featureNames',
            headerName: 'Feature Names',
            width: 100,
        },
        {
            field: 'categoricalFeatures',
            headerName: 'Categorical Features',
            width: 100,
        },
        {
            field: "modelId",
            headerName: "Model ID",
            width: 200
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 100,
            renderCell: (params) => {
                return (
                    <Button
                        onClick={() => handleDelete(params.row.id)}
                        variant="contained"
                        color="secondary"

                    >
                        Delete
                    </Button>
                )
            }
        }
    ];

    const formik = useFormik({
        initialValues: initialValues[0],
        validationSchema: validationSchema[explainerValidationKey],
        onSubmit: (values) => {
            console.log(values)

            let client = mqtt.connect(process.env.REACT_APP_MQTT_SERVER)
            client.on('connect', () => {
                client.subscribe('explainer-'+ values.name.toLowerCase() +'-generate-info', {qos: 1}, (err) => {
                    if (!err) {
                        console.log("Connected with "+ values.name + " microservice info")
                    }
                })
                client.subscribe('explainer-'+ values.name.toLowerCase() +'-generate-error', {qos: 1}, (err) => {
                    if (!err) {
                        console.log("Connected with "+ values.name + " microservice error")
                    }
                })
            })

            setIsLoading(true)
            const formData = new FormData()

            let explainerJSONObject = {
                'name': values.name.trim(),
                'modelId': values.model.trim(),
                'inputType': values.inputType.trim(),
                'columnNames': values.columnNames.trim(),
                'labelColumn': values.labelColumn.trim(),
                'featureNames': values.featureNames.trim(),
                'categoricalFeatures': values.categoricalFeatures.trim(),
            }
            formData.append('explainer', new Blob([JSON.stringify(explainerJSONObject)], { type: "application/json" }))
            formData.append('dataset', values.dataTrainset)

            axios.post(hostIp + ":8080/api/explainers", formData, {
                headers: {
                    "content-type": "multipart/form-data"
                },
            }).then((response) => {
                setNewExplainer(response.data)
                client.on('message', (topic, message) => {
                    if(JSON.parse(message.toString()).explainerId === response.data.id){
                        if(topic === 'explainer-'+ values.name.toLowerCase() +'-generate-error'){
                            setIsLoading(false)
                            toast.error("Error occured: " + JSON.parse(message.toString()).message)
                            client.end()
                        }else{
                            setIsLoading(false)
                            client.end()
                            // formik.resetForm()
                            // setAddExplainer(false)
                            // setAllExplainers((prev) => [...prev, response.data])
                        }
                    } 
                })
            }).catch(err => {
                console.log(err.response)
                toast.error(err.response.data.message)
                setIsLoading(false)
            })
        },
    });

    const getModels = () => {
        axios.get(hostIp + ":8080/api/models").then((res) => {
            setAllModels(res.data);
        });
    };

    const getExplainers = () => {
        axios.get(hostIp + ":8080/api/explainers").then((res) => {
            setAllExplainers(res.data)
            console.log(res)
        })
    }

    useEffect(() => {
        getModels();
        getExplainers();
    }, [])

    const handleDelete = (id) => {
        axios.delete(hostIp + ":8080/api/explainers/" + id).then((response) => {
            setAllExplainers(allExplainers.filter(item => item.id != id))
        })
    }

    const handleChange = (event) => {
        formik.setFieldValue(event.target.name, event.target.value);
        if (formik.values.name === "LIME") {
            setExplainerValidationKey(0)
        }
        if (formik.values.name === "SHAP") {
            setExplainerValidationKey(1)
        }
        if (formik.values.name === "ANCHORS") {
            setExplainerValidationKey(2)
        }
    };

    const checkValidation = () => {
        console.log(formik.errors);
        if (formik.errors && !isEmpty(formik.errors)) {
            toast.error("Error - all fields are required!");
        }
    }

    const handleFileUpload = (event) => {
        if (!event.target.files) return;

        const file = event.target.files[0]
        formik.values.dataTrainset = file
        setFileName(file.name)
    }


    return (
        <>
            <Card className={clsx(classes.root, className)} {...rest}>
                <Backdrop
                    className={clsx(classes.backdrop, className)}
                    sx={{ color: "#fff" }}
                    open={isLoading}
                >
                    <CircularProgress />
                </Backdrop>
                <CardHeader title={"Explainers"}></CardHeader>
                <Divider></Divider>
                <CardContent>

                    <Box position={"relative"}>
                        {!addExplainer && (<><Box>
                            <Button variant="contained" color="primary" onClick={() => setAddExplainer(true)}>
                                Add Explainer
                            </Button>
                        </Box>
                            <Box>
                                <Grid item className={classes.grid} xs={12}>
                                    <div
                                        style={{
                                            height: 600,
                                            width: "100%",
                                        }}
                                    >
                                        <DataGrid
                                            rows={allExplainers}
                                            columns={columns}
                                            pageSize={20}
                                            rowsPerPageOptions={[20]}
                                            checkboxSelection
                                            disableSelectionOnClick
                                            selectionModel={explainer}
                                            onSelectionModelChange={(selection) => {
                                                if (selection.length > 1) {
                                                    const selectionSet = new Set(selectionModel);
                                                    const result = selection.filter(
                                                        (s) => !selectionSet.has(s)
                                                    );
                                                    setExplainer(result);
                                                    setSelectionModel(result);
                                                } else {
                                                    setExplainer(selection);
                                                    setSelectionModel(selection);
                                                }
                                            }}
                                        >
                                        </DataGrid>
                                    </div>
                                </Grid>
                            </Box></>)}

                        {addExplainer && (<>
                            <form
                                onSubmit={(event) => {
                                    checkValidation();
                                    formik.handleSubmit(event);
                                }}>
                                <Box>
                                    <Grid item xs={12} className={clsx(classes.grid, className)}>

                                        <InputLabel id="name-label">Explainer name</InputLabel>
                                        <Select
                                            className={clsx(classes.select, className)}
                                            labelId="name-select-label"
                                            id="name-select"
                                            label="Name"
                                            displayEmpty
                                            name="name"
                                            value={formik.values.name}
                                            onChange={handleChange}
                                            error={
                                                formik.touched.name && Boolean(formik.errors.name)
                                            }
                                            helperText={formik.touched.name && formik.errors.name}
                                        >
                                            <MenuItem key={0} value={"LIME"}>{"LIME"}</MenuItem>
                                            <MenuItem key={1} value={"SHAP"}>{"SHAP"}</MenuItem>
                                            <MenuItem key={4} value={"ANCHORS"}>{"ANCHORS"}</MenuItem>
                                        </Select>
                                        <br></br>
                                        <InputLabel id="input-type-label">Input Type</InputLabel>
                                        <Select
                                            className={clsx(classes.select, className)}
                                            labelId="input-type-select-label"
                                            id="input-type-select"
                                            label="Input-type"
                                            displayEmpty
                                            name="inputType"
                                            value={formik.values.inputType}
                                            onChange={handleChange}
                                            error={
                                                formik.touched.inputType && Boolean(formik.errors.inputType)
                                            }
                                            helperText={formik.touched.inputType && formik.errors.inputType}
                                        >
                                            <MenuItem key={1} value={"tabular"}>{"tabular"}</MenuItem>
                                        </Select>
                                        <br></br>
                                        {formik.values.name === "LIME" && (
                                            <>
                                                {formik.values.inputType === "tabular" && (
                                                    <>
                                                        <InputLabel id="columnNames-label">Column names</InputLabel>
                                                        <Input
                                                            value={formik.values.columnNames}
                                                            name="columnNames"
                                                            onChange={handleChange}
                                                            error={
                                                                formik.touched.columnNames && Boolean(formik.errors.columnNames)
                                                            }
                                                            helperText={formik.touched.columnNames && formik.errors.columnNames}
                                                        ></Input>
                                                        <br></br>
                                                        <InputLabel id="labelColumn-label">Label column</InputLabel>
                                                        <Input
                                                            value={formik.values.labelColumn}
                                                            name="labelColumn"
                                                            onChange={handleChange}
                                                            error={
                                                                formik.touched.labelColumn && Boolean(formik.errors.labelColumn)
                                                            }
                                                            helperText={formik.touched.labelColumn && formik.errors.labelColumn}
                                                        ></Input>
                                                        <br></br>
                                                        <InputLabel id="featureNames-label">Feature Names</InputLabel>
                                                        <Input
                                                            value={formik.values.featureNames}
                                                            name="featureNames"
                                                            onChange={handleChange}
                                                            error={
                                                                formik.touched.featureNames && Boolean(formik.errors.featureNames)
                                                            }
                                                            helperText={formik.touched.featureNames && formik.errors.featureNames}
                                                        ></Input>
                                                        <br></br>
                                                        <InputLabel id="categoricalFeatures-label">Categorical Features</InputLabel>
                                                        <Input
                                                            value={formik.values.categoricalFeatures}
                                                            name="categoricalFeatures"
                                                            onChange={handleChange}
                                                            error={
                                                                formik.touched.categoricalFeatures && Boolean(formik.errors.categoricalFeatures)
                                                            }
                                                            helperText={formik.touched.categoricalFeatures && formik.errors.categoricalFeatures}
                                                        ></Input>
                                                        <br></br>
                                                        <InputLabel id="trainDataset-label">Train Dataset</InputLabel>
                                                        <Button
                                                            variant="contained"
                                                            component="label">
                                                            Upload dataset
                                                            <input type={'file'} hidden onChange={handleFileUpload}>
                                                            </input>
                                                        </Button>
                                                        <InputLabel>File name {fileName}</InputLabel>
                                                        <br></br>
                                                    </>
                                                )}
                                            </>
                                        )}
                                        {formik.values.name === "SHAP" && (
                                            <>
                                                {formik.values.inputType === "tabular" && (
                                                    <>
                                                        <InputLabel id="columnNames-label">Column names</InputLabel>
                                                        <Input
                                                            value={formik.values.columnNames}
                                                            name="columnNames"
                                                            onChange={handleChange}
                                                            error={
                                                                formik.touched.columnNames && Boolean(formik.errors.columnNames)
                                                            }
                                                            helperText={formik.touched.columnNames && formik.errors.columnNames}
                                                        ></Input>
                                                        <br></br>
                                                        <InputLabel id="labelColumn-label">Label column</InputLabel>
                                                        <Input
                                                            value={formik.values.labelColumn}
                                                            name="labelColumn"
                                                            onChange={handleChange}
                                                            error={
                                                                formik.touched.labelColumn && Boolean(formik.errors.labelColumn)
                                                            }
                                                            helperText={formik.touched.labelColumn && formik.errors.labelColumn}
                                                        ></Input>
                                                        <br></br>
                                                        <InputLabel id="featureNames-label">Feature Names</InputLabel>
                                                        <Input
                                                            value={formik.values.featureNames}
                                                            name="featureNames"
                                                            onChange={handleChange}
                                                            error={
                                                                formik.touched.featureNames && Boolean(formik.errors.featureNames)
                                                            }
                                                            helperText={formik.touched.featureNames && formik.errors.featureNames}
                                                        ></Input>
                                                        <br></br>
                                                        <InputLabel id="categoricalFeatures-label">Categorical Features</InputLabel>
                                                        <Input
                                                            value={formik.values.categoricalFeatures}
                                                            name="categoricalFeatures"
                                                            onChange={handleChange}
                                                            error={
                                                                formik.touched.categoricalFeatures && Boolean(formik.errors.categoricalFeatures)
                                                            }
                                                            helperText={formik.touched.categoricalFeatures && formik.errors.categoricalFeatures}
                                                        ></Input>
                                                        <br></br>
                                                        <InputLabel id="trainDataset-label">Train Dataset</InputLabel>
                                                        <Button
                                                            variant="contained"
                                                            component="label">
                                                            Upload dataset
                                                            <input type={'file'} hidden onChange={handleFileUpload}>
                                                            </input>
                                                        </Button>
                                                        <InputLabel>File name {fileName}</InputLabel>
                                                        <br></br>
                                                    </>
                                                )}
                                            </>
                                        )}
                                        {formik.values.name === "ANCHORS" && (
                                            <>
                                                {formik.values.inputType === "tabular" && (
                                                    <>
                                                        <InputLabel id="columnNames-label">Column names</InputLabel>
                                                        <Input
                                                            value={formik.values.columnNames}
                                                            name="columnNames"
                                                            onChange={handleChange}
                                                            error={
                                                                formik.touched.columnNames && Boolean(formik.errors.columnNames)
                                                            }
                                                            helperText={formik.touched.columnNames && formik.errors.columnNames}
                                                        ></Input>
                                                        <br></br>
                                                        <InputLabel id="labelColumn-label">Label column</InputLabel>
                                                        <Input
                                                            value={formik.values.labelColumn}
                                                            name="labelColumn"
                                                            onChange={handleChange}
                                                            error={
                                                                formik.touched.labelColumn && Boolean(formik.errors.labelColumn)
                                                            }
                                                            helperText={formik.touched.labelColumn && formik.errors.labelColumn}
                                                        ></Input>
                                                        <br></br>
                                                        <InputLabel id="featureNames-label">Feature Names</InputLabel>
                                                        <Input
                                                            value={formik.values.featureNames}
                                                            name="featureNames"
                                                            onChange={handleChange}
                                                            error={
                                                                formik.touched.featureNames && Boolean(formik.errors.featureNames)
                                                            }
                                                            helperText={formik.touched.featureNames && formik.errors.featureNames}
                                                        ></Input>
                                                        <br></br>
                                                        <InputLabel id="categoricalFeatures-label">Categorical Features</InputLabel>
                                                        <Input
                                                            value={formik.values.categoricalFeatures}
                                                            name="categoricalFeatures"
                                                            onChange={handleChange}
                                                            error={
                                                                formik.touched.categoricalFeatures && Boolean(formik.errors.categoricalFeatures)
                                                            }
                                                            helperText={formik.touched.categoricalFeatures && formik.errors.categoricalFeatures}
                                                        ></Input>
                                                        <br></br>
                                                        <InputLabel id="trainDataset-label">Train Dataset</InputLabel>
                                                        <Button
                                                            variant="contained"
                                                            component="label">
                                                            Upload dataset
                                                            <input type={'file'} hidden onChange={handleFileUpload}>
                                                            </input>
                                                        </Button>
                                                        <InputLabel>File name {fileName}</InputLabel>
                                                        <br></br>
                                                    </>
                                                )}
                                            </>
                                        )}
                                        <InputLabel id="model-select-label">Model</InputLabel>
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
                                            helperText={formik.touched.model && formik.errors.model}
                                        >
                                            {allModels.length > 0 ? (
                                                allModels.map((model) => (
                                                    <MenuItem key={model.id} value={model.id}>
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

                                </Box>
                                <Box>
                                    <Grid item xs={12} className={clsx(classes.grid, className)}>
                                        <Button variant="contained" onClick={() => setAddExplainer(false)}>
                                            Cancel
                                        </Button>
                                        <Button variant="contained" color="primary" type="submit">
                                            Add
                                        </Button>
                                    </Grid>

                                </Box>
                            </form>

                        </>)}
                    </Box>
                </CardContent>
            </Card>
        </>
    )
}

export default ManageExplainer

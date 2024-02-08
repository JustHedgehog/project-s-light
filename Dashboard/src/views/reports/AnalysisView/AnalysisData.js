import { Box, Button, Card, CardContent, CardHeader, Divider, Grid, makeStyles, Typography } from '@material-ui/core';
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import clsx from "clsx";
import { Form, useFormik } from 'formik';
import { DataGrid } from '@mui/x-data-grid';
import { toast } from 'react-toastify';
import { isEmpty, find } from "lodash";
import * as yup from "yup";
import ShapView from '../ExplainersView/ShapView';
import LimeView from '../ExplainersView/LimeView';
import PropTypes from "prop-types";
import AnchorsView from '../ExplainersView/AnchorsView';



const useStyles = makeStyles((theme) => ({
    root: {},
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

const columns = [
    { field: "id", headerName: "ID", width: 150 },
    {
        field: "explainerName",
        headerName: "Explainer Name",
        width: 150,
    },
    {field: 'analysisStartDate', headerName: "Analysis Start Date", width: 250},
    {field: 'analysisEndDate', headerName: "Analysis End Date", width: 250},
];

const validationSchema = [
    yup.object({
        selectedAnalysis: yup.array().min(1, "Select a analysis"),
    })
];


const AnalysisData = ({ className, ...rest }) => {

    const [allAnalyses, setAllAnalyses] = useState([])
    const [activeStep, setActiveStep] = useState(0);
    const [analysis, setAnalysis] = useState([])
    const [selectionModel, setSelectionModel] = useState([])
    const classes = useStyles()

    const hostIp = process.env.REACT_APP_API_GATEWAY

    const initialValues = [
        {
            selectedAnalyses: [],
        }
    ];


    const getAnalysis = () => {
        axios.get(hostIp + ':8080/api/analysis').then((response) => {
            setAllAnalyses(response.data)
            console.log(response)
        })
    }

    useEffect(() => {
        if(activeStep == 0)
            getAnalysis()
    }, [activeStep])

    const formik = useFormik({
        initialValues: initialValues[0],
        validationSchema: validationSchema[0],
        onSubmit: (values) => {
            if (values.selectedAnalyses.length) {
                handleNext();
                if (activeStep === 0) {
                    const analysisID = values.selectedAnalyses[0]
                    axios.get(hostIp + ":8080/api/analysis/" + analysisID).then((response) => {
                        console.log(response)
                        setAnalysis(response.data)
                    })
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

    const handleNext = () => {
        setActiveStep((prevActiveStep) => {
            return prevActiveStep + 1;
        });
    };

    const handleReset = () => {
        setActiveStep(0);
        formik.resetForm();
        setAllAnalyses([]);
        setAnalysis([]);
    };

    return (
        <Card className={clsx(classes.root, className)} {...rest}>
            <CardHeader title={"Previous Analyses"}></CardHeader>
            <Divider></Divider>
            <CardContent>
                <Box position={"relative"}>
                    <Box>
                        <form onSubmit={(event) => {
                            checkValidation();
                            formik.handleSubmit(event);
                        }}>
                            {activeStep == 0 && (<Grid item className={classes.grid} xs={12}>
                                <Typography
                                    color="inherit"
                                    variant="h5"
                                    component="h1"
                                    style={{ marginBottom: "10px" }}
                                >
                                    Analyses
                                </Typography>
                                <div
                                    style={{
                                        height: 600,
                                        width: "100%",
                                        border:
                                            formik.touched.selectedMessages &&
                                                Boolean(formik.errors.selectedMessages)
                                                ? "1px solid red"
                                                : "none",
                                    }}
                                >
                                    <DataGrid
                                        rows={allAnalyses}
                                        columns={columns}
                                        pageSize={20}
                                        initialState={{
                                            sorting: {
                                                sortModel: [
                                                    {
                                                        field: 'analysis_date',
                                                        sort: 'desc'
                                                    }
                                                ]
                                            }
                                        }}
                                        rowsPerPageOptions={[20]}
                                        checkboxSelection
                                        disableSelectionOnClick
                                        selectionModel={analysis}
                                        onSelectionModelChange={(selection) => {
                                            if (selection.length > 1) {
                                                const selectionSet = new Set(selectionModel);
                                                const result = selection.filter(
                                                    (s) => !selectionSet.has(s)
                                                );
                                                formik.setFieldValue("selectedAnalyses", result);
                                                setAnalysis(result);
                                                setSelectionModel(result);
                                            } else {
                                                formik.setFieldValue("selectedAnalyses", selection);
                                                setAnalysis(selection);
                                                setSelectionModel(selection);
                                            }
                                        }}
                                        helperText={
                                            formik.touched.selectedMessages &&
                                            formik.errors.selectedMessages
                                        }>

                                    </DataGrid>
                                </div>
                            </Grid>)}
                            {activeStep === 1 && analysis != [] && (
                                <Grid item xs={12}>
                                    <p>Explainer name: {analysis.explainerName}</p>
                                    <p>Model name: {analysis.modelName}</p>
                                    <div style={{ textAlign: 'center' }}>
                                        {analysis.explainerName == 'SHAP' ? <ShapView html={JSON.parse(analysis.result)} /> : ""}
                                        {analysis.explainerName == 'LIME' ? <LimeView response={JSON.parse(analysis.result)} /> : ""}
                                        {analysis.explainerName === 'ANCHORS' ? <AnchorsView html={JSON.parse(analysis.result)}></AnchorsView> : ""}
                                    </div>
                                </Grid>
                            )}
                            <div>
                                {activeStep === 1 ? (
                                    <div className={classes.button}>
                                        <Button variant="contained" onClick={handleReset}>
                                            Reset
                                        </Button>
                                    </div>
                                ) : (
                                    <div>
                                        <div className={classes.button}>
                                            <Button variant="contained" color="primary" type="submit">
                                                Analyze
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
    )

}

AnalysisData.propTypes = {
    className: PropTypes.string,
  };

export default AnalysisData;
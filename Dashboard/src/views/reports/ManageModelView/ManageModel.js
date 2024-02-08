import { Box, Button, Card, CardContent, CardHeader, Divider, formatMs, Grid, Input, InputLabel, makeStyles, MenuItem, Select, Typography } from "@material-ui/core";
import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import * as yup from "yup";
import { isEmpty, find } from "lodash";

const hostIp = process.env.REACT_APP_API_GATEWAY


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

const validationSchema = [
    yup.object({
        name: yup.string("Enter the name").trim().required("Enter the name"),
    })];


const ManageModel = ({ className, ...rest }) => {
    const [allModels, setAllModels] = useState([])
    const [model, setModel] = useState([])
    const [selectionModel, setSelectionModel] = useState([])
    const [addModel, setAddModel] = useState(false)
    const [categoricalEncoders, setCategoricalEncoders] = useState([])

    const handleDelete = (id) => {

        axios.delete(hostIp + ":8080/api/models/" + id).then((response) => {
            setAllModels(allModels.filter(item => item.id != id))
        })
        
    }
    
    const columns = [
        { field: "id", headerName: "ID", width: 300 },
        {
            field: "name",
            headerName: "Name",
            width: 150,
        },
        {
            field: "type",
            headerName: "Type",
            width: 100,
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 400,
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
    
    const classes = useStyles()

    const initialValues = [
        {
            name: "",
            type: "offline",
            modelFile: "",
            dataScaler: "",
            labelEncoder: "",
        }
    ];

    const checkValidation = () => {
        console.log(formik.errors);
        if (formik.errors && !isEmpty(formik.errors)) {
            toast.error("Error - all fields are required!");
        }
    }

    const handleChange = (event) => {
        console.log(event)
        formik.setFieldValue(event.target.name, event.target.value);
    };

    const getModels = () => {
        axios.get(hostIp + ":8080/api/models").then((res) => {
            setAllModels(res.data);
            console.log(res)
        });
    };

    useEffect(() => {
        getModels();
    }, [])

    const formik = useFormik({
        initialValues: initialValues[0],
        validationSchema: validationSchema[0],
        onSubmit: (values) => {

            const data = {
                'name': values.name.trim(),
                'type': values.type.trim(),
            }

            const formData = new FormData();
            
            let scalersAndEncoders = [values.dataScaler, values.labelEncoder]

            formData.append("modelFile", values.modelFile)
            if(categoricalEncoders.length != 0) scalersAndEncoders.push(...categoricalEncoders)


            formData.append('model', new Blob([JSON.stringify(data)], {type: "application/json"}))

            for(let i=0; i< scalersAndEncoders.length; i++){
                formData.append("scalersAndEncoders",scalersAndEncoders[i]);
              }

            axios.post(hostIp + ":8080/api/models", formData, {
                headers: {
                    "content-type": "multipart/form-data"
                }
            }).then((response) => {
                console.log(response)
                formik.resetForm()
                setAddModel(false)
                setAllModels((prev) => [...prev, response.data])
            }).catch(error => {
                toast.error(error.response.data.message);
            })

        },
    });


    const handleFileUpload = (event) => {
        if (!event.target.files) return;
        const file = event.target.files[0]
        formik.setFieldValue(event.target.name, file);
    }

    const addCategoricalEncoder = () => {
        setCategoricalEncoders([...categoricalEncoders, {file: ""}])
    }

    const handleRemoveClick = (index) => {
        const list = [...categoricalEncoders];
        list.splice(index, 1);
        setCategoricalEncoders(list);
    };

    const handleInputFileChange = (e, index) => {
        if (!e.target.files) return;
        const file = e.target.files[0]
        const list = [...categoricalEncoders];
        list[index] = file;
        setCategoricalEncoders(list)
    }

    return (
        <Card className={clsx(classes.root, className)} {...rest}>
            <CardHeader title={"Models"}></CardHeader>
            <Divider></Divider>
            <CardContent>
                <Box position={"relative"}>
                    {!addModel && (<><Box>
                        <Button variant="contained" color="primary" onClick={() => setAddModel(true)}>
                            Add model
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
                                        rows={allModels}
                                        columns={columns}
                                        pageSize={20}
                                        rowsPerPageOptions={[20]}
                                        checkboxSelection
                                        disableSelectionOnClick
                                        selectionModel={model}
                                        onSelectionModelChange={(selection) => {
                                            if (selection.length > 1) {
                                                const selectionSet = new Set(selectionModel);
                                                const result = selection.filter(
                                                    (s) => !selectionSet.has(s)
                                                );
                                                setModel(result);
                                                setSelectionModel(result);
                                            } else {
                                                setModel(selection);
                                                setSelectionModel(selection);
                                            }
                                        }}
                                    >
                                    </DataGrid>
                                </div>
                            </Grid>
                        </Box></>)}

                    {addModel && (<>
                        <form
                            onSubmit={(event) => {
                                checkValidation();
                                formik.handleSubmit(event);
                            }}>
                            <Box>
                                <Grid item xs={12} className={clsx(classes.grid, className)}>

                                <InputLabel id="name-label">Model name</InputLabel>
                                <Input
                                    value={formik.values.name}
                                    name="name"
                                    onChange={handleChange}
                                    error={
                                        formik.touched.name && Boolean(formik.errors.name)
                                    }
                                    helpertext={formik.touched.name && formik.errors.name}
                                ></Input>
                                    <br></br>
                                    <InputLabel id="modelFile-label">Model File</InputLabel>
                                        <Button
                                            variant="contained"
                                            component="label">
                                            Upload model file
                                            <input type={'file'} name="modelFile" hidden onChange={handleFileUpload}>
                                            </input>
                                        </Button>
                                    <InputLabel>File name {formik.values.modelFile.name}</InputLabel>
                                    <br></br>
                                    <InputLabel id="dataScaler-label">Data Scaler File</InputLabel>
                                        <Button
                                            variant="contained"
                                            component="label">
                                            Upload data scaler file
                                            <input type={'file'} name="dataScaler" hidden onChange={handleFileUpload}>
                                            </input>
                                        </Button>
                                    <InputLabel>File name {formik.values.dataScaler.name}</InputLabel>
                                    <br></br>
                                    <InputLabel id="labelEncoder-label">Label Encoder File</InputLabel>
                                        <Button
                                            variant="contained"
                                            component="label">
                                            Upload label encoder file
                                            <input type={'file'} name="labelEncoder" hidden onChange={handleFileUpload}>
                                            </input>
                                        </Button>
                                    <InputLabel>File name {formik.values.labelEncoder.name}</InputLabel>
                                    <br></br>
                                    <InputLabel id="categoricalEncoders-label">Categorical Encoders</InputLabel>
                                    <Button onClick={() => addCategoricalEncoder()} variant='contained'>Add categorical encoder</Button>
                                    <br></br>
                                    <br></br>

                                    {categoricalEncoders.map((x,i) => {
                                        return(
                                            <div className="box" key={i}>
                                                <Button
                                                    variant="contained"
                                                    component="label">
                                                    Upload categorical encoder file
                                                    <input type={'file'} hidden onChange={(e) => handleInputFileChange(e,i)}>
                                                    </input>
                                                </Button>
                                                <Button variant="contained" onClick={() => handleRemoveClick(i)}>Remove</Button>
                                                <InputLabel>File name {categoricalEncoders[i].name}</InputLabel>
                                                <br></br>
                                            </div>
                                        )
                                    })}
                                </Grid>

                            </Box>
                            <Box>
                                <Grid item xs={12} className={clsx(classes.grid, className)}>
                                <Button variant="contained" onClick={() => setAddModel(false)}>
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
    )
}

export default ManageModel

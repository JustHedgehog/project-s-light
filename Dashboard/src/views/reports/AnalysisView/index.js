import { Container, Grid, makeStyles } from '@material-ui/core';
import React, { useEffect } from 'react'
import Page from 'src/components/Page';
import AnalysisData from './AnalysisData';


const useStyles = makeStyles((theme) => ({
    root: {
        backgroundColor: theme.palette.background.dark,
        minHeight: '100%',
        paddingBottom: theme.spacing(2),
        paddingTop: theme.spacing(2)
    }
}));

const Analysis = () => {
    const classes = useStyles();
    
    return (
        <Page
            className={classes.root}
            title="Analysis"
        >
            <Container maxWidth={false}>
                <Grid
                    item
                    lg={12}
                    md={12}
                    xl={12}
                    xs={12}
                >
                    <AnalysisData/>
                </Grid>
            </Container>
        </Page>
    )
}


export default Analysis
import { Container, Grid, makeStyles } from '@material-ui/core';
import React from 'react'
import Page from 'src/components/Page';
import ManageExplainer from './ManageExplainer';

const useStyles = makeStyles((theme) => ({
    root: {
      backgroundColor: theme.palette.background.dark,
      minHeight: '100%',
      paddingBottom: theme.spacing(2),
      paddingTop: theme.spacing(2)
    }
  }));

const ManageExplainers = () => {

    const classes = useStyles()

    return (
        <Page
      className={classes.root}
      title="Dashboard"
    >
      <Container maxWidth={false}>
        <Grid
            item
            lg={12}
            md={12}
            xl={12}
            xs={12}
        >
          <ManageExplainer></ManageExplainer>
        </Grid>
      </Container>
    </Page>
    )

}


export default ManageExplainers
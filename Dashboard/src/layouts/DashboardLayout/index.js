import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { makeStyles, Grid } from '@material-ui/core';
import TopBar from './TopBar';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    height: '100%',
    overflow: 'hidden',
    width: '100%'
  },
  wrapper: {
    display: 'flex',
    flex: '1 1 auto',
    overflow: 'hidden',
    paddingTop: 115,
    [theme.breakpoints.up('lg')]: {
      paddingLeft: 0
    }
  },
  contentContainer: {
    display: 'flex',
    flex: '1 1 auto',
    overflow: 'hidden'
  },
  content: {
    flex: '1 1 auto',
    height: '100%',
    overflow: 'auto'
  },
  footer: {
    padding: theme.spacing(2),
    background: '#fff',
    position: 'static',
    bottom: 0,
    width: '100%',
},
}));

const DashboardLayout = () => {
  const classes = useStyles();

  return (
    <React.Fragment><div className={classes.root}>
      <TopBar/>
      <div className={classes.wrapper}>
        <div className={classes.contentContainer}>
          <div className={classes.content}>
            <Outlet />
          </div>
        </div>
      </div>
    </div>
          <footer className={classes.footer}>
          <Grid item xs={12}>
                <Grid container
                      spacing={2} justifyContent="space-evenly"
                      alignItems="center">
                    <Grid item> <img src={"/static/itti.png"}  height={60}/></Grid>
                </Grid>
            </Grid>
            </footer>
            </React.Fragment>
  );
};

export default DashboardLayout;

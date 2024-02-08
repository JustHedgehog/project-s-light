import React, { useState } from "react";
import { Link as RouterLink, Router, useLocation } from "react-router-dom";
import clsx from "clsx";
import PropTypes from "prop-types";
import {
  AppBar,
  Toolbar,
  Tab,
  Tabs,
  Grid,
  makeStyles,
} from "@material-ui/core";
import Logo from '../../components/Logo'

const useStyles = makeStyles(() => ({
  root: {
    backgroundImage: '#034EA2',
  },
  logo: {background: 'white'},
  secondaryBar: {
    marginTop: 0,
  },
  avatar: {
    width: 60,
    height: 60,
  },
}));

const TopBar = ({ className, onMobileNavOpen, ...rest }) => {
  const classes = useStyles();
  const [tabValue, setTabValue] = useState(sessionStorage.getItem("tabValue") === null ? 0 : parseInt(sessionStorage.getItem("tabValue")))

  const handleChangeTabsValue = (event,newValue) => {
      setTabValue(newValue)
      sessionStorage.setItem("tabValue", newValue)
  }

  const location = useLocation()
  const isWebBdeTestPanelRendering = location.pathname === "/app/bde"

  return (
    <React.Fragment>
      <AppBar className={clsx(classes.root)} elevation={0} {...rest}>
        <Toolbar className={clsx(classes.logo)}>
          <Grid container alignItems="center" spacing={1}>
            <Grid item xs >
              <Logo/>
            </Grid>
          </Grid>
        </Toolbar>
        { !isWebBdeTestPanelRendering && 
        <Tabs value={tabValue} onChange={handleChangeTabsValue} textColor="inherit">
          <Tab
            textColor="inherit"
            component={RouterLink}
            to="/app/dashboard"
            label="Local explainers"
          />
          <Tab
            textColor="inherit"
            component={RouterLink}
            to="/app/analysis"
            label="Previous Analyses"
          />
          <Tab 
            textColor="inherit" 
            label="Manage Models" 
            component={RouterLink} 
            to="/app/model" />
          <Tab 
            textColor="inherit" 
            label="Manage Explainers"
            component={RouterLink}
            to="/app/explainer" 
            />
        </Tabs>
        }
      </AppBar>
    </React.Fragment>
  );
};

TopBar.propTypes = {
  className: PropTypes.string,
  onMobileNavOpen: PropTypes.func,
};

export default TopBar;

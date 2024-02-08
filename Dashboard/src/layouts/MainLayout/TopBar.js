import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import {
  AppBar,
  Toolbar,
  makeStyles,
  Typography
} from '@material-ui/core';
import Logo from '../../components/Logo'

const useStyles = makeStyles(({
  root: {},
  toolbar: {
    height: 64
  },
  link: {
    color: 'inherit'
  }
}));

const TopBar = ({ className, ...rest }) => {
  const classes = useStyles();

  return (
    <AppBar
      className={clsx(classes.root, className)}
      elevation={0}
      {...rest}
    >
      <Toolbar>
        <RouterLink to="/"    className={clsx(classes.link, className)}>
        <Typography color="inherit" variant="h3" component="h1">
            <Logo/>
          </Typography>
        </RouterLink>
      </Toolbar>
    </AppBar>
  );
};

TopBar.propTypes = {
  className: PropTypes.string
};

export default TopBar;

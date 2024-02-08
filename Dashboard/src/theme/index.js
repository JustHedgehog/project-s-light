import { colors } from "@material-ui/core";
import { createTheme } from "@material-ui/core/styles";
import shadows from "./shadows";
import typography from "./typography";

const theme = createTheme({
  palette: {
    background: {
      dark: "#F4F6F8",
      default: colors.common.white,
      paper: colors.common.white,
    },
    primary: {
      main: "#034EA2",
    },
    secondary: {
      main: "#e74c3c",
    },
    text: {
      primary: colors.blueGrey[900],
      secondary: colors.blueGrey[600],
    },
  },
  overrides: {
    MuiButton: {
      containedPrimary: {
        color: "#fff",
      },
    },
    MuiChip: {
      colorPrimary: {
        color: "#fff",
      },
    },
  },
  shadows,
  typography,
});

export default theme;

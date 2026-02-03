
import { createTheme } from "@mui/material/styles";

// Create a theme instance.
const theme = createTheme({
    palette: {
        mode: "light",
        // Match your existing HSL color variables
        primary: {
            main: "hsl(222.2 84% 4.9%)", // Matches your --primary color
            light: "hsl(210 40% 96%)",
            dark: "hsl(222.2 47.4% 11.2%)",
            contrastText: "hsl(210 40% 98%)",
        },
        secondary: {
            main: "hsl(210 40% 96%)", // Matches your --secondary color
            light: "hsl(210 40% 98%)",
            dark: "hsl(215.4 16.3% 46.9%)",
            contrastText: "hsl(222.2 84% 4.9%)",
        },
        error: {
            main: "hsl(0 84.2% 60.2%)", // Matches your --destructive color
        },
        warning: {
            main: "hsl(47.9 95.8% 53.1%)",
        },
        info: {
            main: "hsl(207.9 89.1% 53.5%)",
        },
        success: {
            main: "hsl(142.1 76.2% 36.3%)",
        },
        background: {
            default: "hsl(0 0% 100%)", // Matches your --background
            paper: "hsl(0 0% 100%)",
        },
        text: {
            primary: "hsl(222.2 84% 4.9%)", // Matches your --foreground
            secondary: "hsl(215.4 16.3% 46.9%)",
        },
        divider: "hsl(214.3 31.8% 91.4%)", // Matches your --border
    },
    typography: {
        fontFamily: "Roboto, Arial, sans-serif",
        h1: {
            fontSize: "2.5rem",
            fontWeight: 700,
        },
        h2: {
            fontSize: "2rem",
            fontWeight: 600,
        },
        h3: {
            fontSize: "1.75rem",
            fontWeight: 600,
        },
        h4: {
            fontSize: "1.5rem",
            fontWeight: 600,
        },
        h5: {
            fontSize: "1.25rem",
            fontWeight: 600,
        },
        h6: {
            fontSize: "1rem",
            fontWeight: 600,
        },
        body1: {
            fontSize: "0.875rem",
            lineHeight: 1.5,
        },
        body2: {
            fontSize: "0.8125rem",
            lineHeight: 1.43,
        },
    },
    shape: {
        borderRadius: 8, // Consistent with your design
    },
    components: {
        // Customize MUI components to match your design
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: "none",
                    borderRadius: 8,
                    fontWeight: 500,
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
                    borderRadius: 12,
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 8,
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 6,
                },
            },
        },
    },
});

export default theme;

"use client"

import { Container } from "@mui/material"
import FindFood from "./FindFood"

import createTheme from "@mui/material/styles/createTheme"
import ThemeProvider from "@mui/material/styles/ThemeProvider"

const theme = createTheme({
    typography: {
        button: {
            textTransform: "none",
        },
    },
})

export default function Home() {
    return (
        <ThemeProvider theme={theme}>
            <Container maxWidth="sm" sx={{ padding: "24px" }}>
                <FindFood />
            </Container>
        </ThemeProvider>
    )
}

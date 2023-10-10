"use client"

import { Container } from "@mui/material"
import FindFood from "./FindFood"

export default function Home() {
    return (
        <Container maxWidth="sm" sx={{ padding: "24px" }}>
            <FindFood />
        </Container>
    )
}

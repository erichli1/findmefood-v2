import { Typography } from "@mui/material"

export function Header({ text }: { text: string }) {
    return (
        <Typography variant="h6" fontWeight="bold" sx={{ padding: 0 }}>
            {text}
        </Typography>
    )
}

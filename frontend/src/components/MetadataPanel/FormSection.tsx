import React from "react";
import { Box, Divider, Typography } from "@mui/material";

interface FormSectionProps {
  title: string;
  children: React.ReactNode;
}

const FormSection: React.FC<FormSectionProps> = ({ title, children }) => (
  <>
    <Divider sx={{ my: 2 }}>
      <Typography variant="caption" color="text.secondary">
        {title}
      </Typography>
    </Divider>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {children}
    </Box>
  </>
);

export default FormSection;

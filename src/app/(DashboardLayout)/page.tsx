"use client";
import React from "react";
import { useEffect, useState } from "react";

import { Typography } from "@mui/material";
import PageContainer from "@/app/components/container/PageContainer";
import DashboardCard from "@/app/components/shared/DashboardCard";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";

// components
import Welcome from "@/app/(DashboardLayout)/layout/shared/welcome/Welcome";

const BCrumb = [
  {
    to: "/",
    title: "Dashboard",
  },
  {
    title: "Sample Page",
  },
];

export default function Dashboard() {
  const [isLoading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <PageContainer title="Sample Page" description="this is page">
      {/* breadcrumb */}
      <Breadcrumb title="Sample Page" items={BCrumb} />
      <DashboardCard title="Sample Page">
        <Typography>This is a sample2 page</Typography>
      </DashboardCard>
      <Welcome />
    </PageContainer>
  );
}

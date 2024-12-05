"use client";
import React from "react";
import { useEffect, useState } from "react";

import PageContainer from "@/app/components/container/PageContainer";
import DashboardCard from "@/app/components/shared/DashboardCard";
import Breadcrumb from "./layout/shared/breadcrumb/Breadcrumb";
import { Text } from "@mantine/core";

// components

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
        <Text>This is a sample2 page</Text>
      </DashboardCard>
    </PageContainer>
  );
}

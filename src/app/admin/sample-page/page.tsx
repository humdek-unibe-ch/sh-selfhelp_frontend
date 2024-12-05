"use client";
import PageContainer from "@/app/components/container/PageContainer";
import DashboardCard from "@/app/components/shared/DashboardCard";
import { Text } from "@mantine/core";

const SamplePage = () => {
  return (
    <PageContainer title="Sample Page" description="this is Sample page">
      <DashboardCard title="Sample Page">
        <Text>This is a sample2 page</Text>
      </DashboardCard>
    </PageContainer>
  );
};

export default SamplePage;

"use client";
import { useEffect, useState } from "react";
import { Typography } from "@mui/material";
import PageContainer from "@/app/components/container/PageContainer";
import DashboardCard from "@/app/components/shared/DashboardCard";
import Breadcrumb from "@/app/(DashboardLayout)/layout/shared/breadcrumb/Breadcrumb";

interface PageData {
  title: string;
  content: string;
}

export default function DynamicPage({ params }: { params: { slug: string } }) {
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPageData() {
      // In the future, this would be an API call
      // const data = await fetch(`/api/pages/${params.slug}`).then(res => res.json());
      
      // For now, mock data
      const mockData = {
        title: params.slug.charAt(0).toUpperCase() + params.slug.slice(1),
        content: `This is the dynamic content for ${params.slug} page`
      };
      
      setPageData(mockData);
      setLoading(false);
    }
    loadPageData();
  }, [params.slug]);

  const BCrumb = [
    {
      to: "/",
      title: "Dashboard",
    },
    {
      title: pageData?.title || params.slug,
    },
  ];

  if (isLoading) return <div>Loading...</div>;

  return (
    <PageContainer title={pageData?.title || ""} description={`This is ${params.slug} page`}>
      <Breadcrumb title={pageData?.title || ""} items={BCrumb} />
      <DashboardCard title={pageData?.title || ""}>
        <Typography>{pageData?.content}</Typography>
      </DashboardCard>
    </PageContainer>
  );
} 
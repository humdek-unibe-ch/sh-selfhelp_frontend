"use client";
import { useEffect } from "react";
import { notFound } from 'next/navigation';
import PageContainer from "@/app/components/container/PageContainer";
import { useNavigation } from "@/hooks/useNavigation";
import { usePageContent } from "@/hooks/usePageConent";
import BasicStyle from "@/app/components/styles/BasicStyle";
import DashboardCard from "@/app/components/shared/DashboardCard";
import Breadcrumb from "../layout/shared/breadcrumb/Breadcrumb";

export default function DynamicPage({ params }: { params: { slug: string } }) {
    const { routes, isLoading: routesLoading } = useNavigation();
    const { content: pageContent, isLoading: pageLoading } = usePageContent(params.slug);

    const isValid = routes?.some(route => route.path === `/${params.slug}`);

    if (routesLoading || pageLoading) {
        return (
            <PageContainer>
                <DashboardCard>
                    <div>Loading...</div>
                </DashboardCard>
            </PageContainer>
        );
    }

    if (!isValid) {
        notFound();
    }

    return (
        <PageContainer title={pageContent?.title || params.slug} description={pageContent?.description}>
            <DashboardCard>
                <Breadcrumb />
                <div>
                    {pageContent?.content?.map((style, index) => (
                        style ? <BasicStyle key={`style-${index}`} style={style} /> : null
                    ))}
                </div>
            </DashboardCard>
        </PageContainer>
    );
}
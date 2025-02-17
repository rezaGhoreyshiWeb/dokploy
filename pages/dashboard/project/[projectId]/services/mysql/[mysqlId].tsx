import { ShowAdvancedMysql } from "@/components/dashboard/mysql/advanced/show-mysql-advanced-settings";
import { ShowBackupMySql } from "@/components/dashboard/mysql/backups/show-backup-mysql";
import { DeleteMysql } from "@/components/dashboard/mysql/delete-mysql";
import { ShowMysqlEnvironment } from "@/components/dashboard/mysql/environment/show-mysql-environment";
import { ShowExternalMysqlCredentials } from "@/components/dashboard/mysql/general/show-external-mysql-credentials";
import { ShowGeneralMysql } from "@/components/dashboard/mysql/general/show-general-mysql";
import { ShowInternalMysqlCredentials } from "@/components/dashboard/mysql/general/show-internal-mysql-credentials";
import { MysqlIcon } from "@/components/icons/data-tools-icons";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { appRouter } from "@/server/api/root";
import { validateRequest } from "@/server/auth/auth";
import { api } from "@/utils/api";
import { createServerSideHelpers } from "@trpc/react-query/server";
import type {
	GetServerSidePropsContext,
	InferGetServerSidePropsType,
} from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useState, type ReactElement } from "react";
import superjson from "superjson";
import { DockerMonitoring } from "@/components/dashboard/monitoring/docker/show";
import { StatusTooltip } from "@/components/shared/status-tooltip";
import { ShowDockerLogs } from "@/components/dashboard/application/logs/show";
import { UpdateMysql } from "@/components/dashboard/mysql/update-mysql";
import { ProjectLayout } from "@/components/layouts/project-layout";

type TabState = "projects" | "monitoring" | "settings" | "backups" | "advanced";

const MySql = (
	props: InferGetServerSidePropsType<typeof getServerSideProps>,
) => {
	const { mysqlId, activeTab } = props;
	const router = useRouter();
	const { projectId } = router.query;
	const [tab, setSab] = useState<TabState>(activeTab);
	const { data } = api.mysql.one.useQuery({ mysqlId });
	const { data: auth } = api.auth.get.useQuery();
	const { data: user } = api.user.byAuthId.useQuery(
		{
			authId: auth?.id || "",
		},
		{
			enabled: !!auth?.id && auth?.rol === "user",
		},
	);
	return (
		<div className="pb-10">
			<div className="flex flex-col gap-4">
				<Breadcrumb>
					<BreadcrumbItem>
						<BreadcrumbLink as={Link} href="/dashboard/projects">
							Projects
						</BreadcrumbLink>
					</BreadcrumbItem>
					<BreadcrumbItem>
						<BreadcrumbLink
							as={Link}
							href={`/dashboard/project/${data?.project.projectId}`}
						>
							{data?.project.name}
						</BreadcrumbLink>
					</BreadcrumbItem>

					<BreadcrumbItem isCurrentPage>
						<BreadcrumbLink>{data?.name}</BreadcrumbLink>
					</BreadcrumbItem>
				</Breadcrumb>
				<header className="mb-6 flex w-full items-center justify-between max-sm:flex-wrap gap-4">
					<div className="flex  flex-col justify-between w-fit gap-2">
						<div className="flex flex-row items-center gap-2 xl:gap-4 flex-wrap">
							<h1 className="flex items-center gap-2 text-xl font-bold lg:text-3xl">
								{data?.name}
							</h1>
							<span className="text-sm">{data?.appName}</span>
						</div>

						{data?.description && (
							<p className="text-sm text-muted-foreground  max-w-6xl">
								{data?.description}
							</p>
						)}
					</div>
					<div className="relative flex flex-row gap-4">
						<div className="absolute -right-1  -top-2">
							<StatusTooltip status={data?.applicationStatus} />
						</div>

						<MysqlIcon className="h-8 w-8 text-muted-foreground" />
					</div>
				</header>
			</div>
			<Tabs
				value={tab}
				defaultValue="general"
				className="w-full"
				onValueChange={(e) => {
					setSab(e as TabState);
					const newPath = `/dashboard/project/${projectId}/services/mysql/${mysqlId}?tab=${e}`;

					router.push(newPath, undefined, { shallow: true });
				}}
			>
				<div className="flex flex-row items-center justify-between  w-full gap-4">
					<TabsList className="md:grid md:w-fit md:grid-cols-6 max-md:overflow-y-scroll justify-start">
						<TabsTrigger value="general">General</TabsTrigger>
						<TabsTrigger value="environment">Environment</TabsTrigger>
						<TabsTrigger value="monitoring">Monitoring</TabsTrigger>
						<TabsTrigger value="backups">Backups</TabsTrigger>
						<TabsTrigger value="logs">Logs</TabsTrigger>
						<TabsTrigger value="advanced">Advanced</TabsTrigger>
					</TabsList>

					<div className="flex flex-row gap-4">
						<UpdateMysql mysqlId={mysqlId} />
						{(auth?.rol === "admin" || user?.canDeleteServices) && (
							<DeleteMysql mysqlId={mysqlId} />
						)}
					</div>
				</div>

				<TabsContent value="general">
					<div className="flex flex-col gap-4 pt-2.5">
						<ShowGeneralMysql mysqlId={mysqlId} />
						<ShowInternalMysqlCredentials mysqlId={mysqlId} />
						<ShowExternalMysqlCredentials mysqlId={mysqlId} />
					</div>
				</TabsContent>
				<TabsContent value="environment" className="w-full">
					<div className="flex flex-col gap-4 pt-2.5">
						<ShowMysqlEnvironment mysqlId={mysqlId} />
					</div>
				</TabsContent>
				<TabsContent value="monitoring">
					<div className="flex flex-col gap-4 pt-2.5">
						<DockerMonitoring appName={data?.appName || ""} />
					</div>
				</TabsContent>
				<TabsContent value="logs">
					<div className="flex flex-col gap-4  pt-2.5">
						<ShowDockerLogs appName={data?.appName || ""} />
					</div>
				</TabsContent>
				<TabsContent value="backups">
					<div className="flex flex-col gap-4 pt-2.5">
						<ShowBackupMySql mysqlId={mysqlId} />
					</div>
				</TabsContent>
				<TabsContent value="advanced">
					<div className="flex flex-col gap-4 pt-2.5">
						<ShowAdvancedMysql mysqlId={mysqlId} />
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default MySql;
MySql.getLayout = (page: ReactElement) => {
	return <ProjectLayout>{page}</ProjectLayout>;
};

export async function getServerSideProps(
	ctx: GetServerSidePropsContext<{ mysqlId: string; activeTab: TabState }>,
) {
	const { query, params, req, res } = ctx;
	const activeTab = query.tab;

	const { user, session } = await validateRequest(req, res);
	if (!user) {
		return {
			redirect: {
				permanent: true,
				destination: "/",
			},
		};
	}
	// Fetch data from external API
	const helpers = createServerSideHelpers({
		router: appRouter,
		ctx: {
			req: req as any,
			res: res as any,
			db: null as any,
			session: session,
			user: user,
		},
		transformer: superjson,
	});

	if (typeof params?.mysqlId === "string") {
		try {
			await helpers.mysql.one.fetch({
				mysqlId: params?.mysqlId,
			});

			return {
				props: {
					trpcState: helpers.dehydrate(),
					mysqlId: params?.mysqlId,
					activeTab: (activeTab || "general") as TabState,
				},
			};
		} catch (error) {
			return {
				redirect: {
					permanent: false,
					destination: "/dashboard/projects",
				},
			};
		}
	}

	return {
		redirect: {
			permanent: false,
			destination: "/",
		},
	};
}

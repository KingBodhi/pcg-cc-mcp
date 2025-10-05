use db::DBService;
use rmcp::{ServiceExt, transport::stdio};
use server::mcp::task_server::TaskServer;
use tracing_subscriber::{EnvFilter, prelude::*};
use utils::sentry::sentry_layer;

fn main() -> anyhow::Result<()> {
    let environment = if cfg!(debug_assertions) {
        "dev"
    } else {
        "production"
    };
    let _guard = sentry::init((
        "https://1065a1d276a581316999a07d5dffee26@o4509603705192449.ingest.de.sentry.io/4509605576441937",
        sentry::ClientOptions {
            release: sentry::release_name!(),
            environment: Some(environment.into()),
            ..Default::default()
        },
    ));
    sentry::configure_scope(|scope| {
        scope.set_tag("source", "mcp");
    });
    tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .unwrap()
        .block_on(async {
            tracing_subscriber::registry()
                .with(
                    tracing_subscriber::fmt::layer()
                        .with_writer(std::io::stderr)
                        .with_filter(EnvFilter::new("debug")),
                )
                .with(sentry_layer())
                .init();

            let version = env!("CARGO_PKG_VERSION");
            tracing::debug!("[MCP] Starting MCP task server version {version}...");

            // Database connection (ensures file + migrations on first run)
            let db_service = DBService::new().await?;
            let pool = db_service.pool.clone();

            let service = TaskServer::new(pool)
                .serve(stdio())
                .await
                .inspect_err(|e| {
                    tracing::error!("serving error: {:?}", e);
                    sentry::capture_error(e);
                })?;

            service.waiting().await?;
            Ok(())
        })
}

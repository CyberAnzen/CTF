async function gracefulShutdown(server, loggerWorker) {
  console.log("Shutting down: asking logger to flush...");
  const FLUSH_TIMEOUT = 5000;

  const flushPromise = new Promise((resolve) => {
    const onMessage = (msg) => {
      if (msg && msg.type === "shutdownComplete") {
        loggerWorker.removeListener("message", onMessage);
        resolve(true);
      }
    };

    loggerWorker.on("message", onMessage);
    loggerWorker.postMessage({ type: "shutdown" });

    setTimeout(() => {
      loggerWorker.removeListener("message", onMessage);
      resolve(false);
    }, FLUSH_TIMEOUT);
  });

  const flushed = await flushPromise;
  console.log("Logger flush acknowledged:", flushed);

  server.close(() => {
    console.log("HTTP server closed. Exiting process.");
    process.exit(flushed ? 0 : 1);
  });
}

module.exports = gracefulShutdown;

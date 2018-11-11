package org.libjs.tdom.demo;

import java.nio.file.Paths;

import io.undertow.Handlers;
import io.undertow.Undertow;
import io.undertow.server.handlers.resource.PathResourceManager;

public class DemoLauncher {

	private static final String SERVER_HOST = "localhost";
	private static final int SERVER_PORT = 8080;

	public static void main(String... args) throws Exception {
		Undertow.builder().addHttpListener(SERVER_PORT, SERVER_HOST,
			Handlers.header(
				Handlers.path(
					Handlers.resource(new PathResourceManager(Paths.get("./src/main/resources")))
				).addPrefixPath(
					"/lib/tdom/",
					Handlers.resource(new PathResourceManager(Paths.get("../tdom").toRealPath()))
				),
			"Cache-Control", "no-store")
			)
		.build()
		.start();
		
		System.out.println("Server started. Open http://" + SERVER_HOST + ":" + SERVER_PORT + " in your browser (preferably - Google Chrome).");
		System.out.println("If you are in console, press Ctrl+C to stop the server");
		
	}
	
}

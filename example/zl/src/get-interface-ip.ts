import { createSocket } from "dgram";

/**
 * Returns one of our externally-accessible IP addresses. This is useful in local development, since
 * we can't access our server via `http://localhost` from outside of the dockershell container.
 *
 * This is a direct port from of the logic in get_interface_ip from Python, used by werkzeug (which
 * underpins Flask):
 * https://github.com/pallets/werkzeug/blob/d3dd65a27388fbd39d146caacf2563639ba622f0/src/werkzeug/serving.py#L669C1-L685C1
 */
export async function getInterfaceIp(family: "IPv4" | "IPv6"): Promise<string> {
    return new Promise((resolve) => {
        // these are just arbitrary private addresses
        const host =
            family === "IPv6" ? "fd31:f903:5ab5:1::1" : "10.253.155.219";

        const socket = createSocket(family == "IPv4" ? "udp4" : "udp6");
        socket.on("error", () => {
            socket.close();
            resolve(family === "IPv6" ? "::1" : "127.0.0.1");
        });

        const PORT = 58162; // specific value doesn't really matter
        socket.connect(PORT, host, () => {
            const address = socket.address().address;
            socket.close();

            if (address == "::") {
                // IPv6 is strange and complex, and can return :: as a "don't know / don't care"
                // answer if it doesn't have to -- and the logic we're using here to select a local
                // interface IP address isn't sufficiently real to cause it to actually pick an
                // interface.
                // While we could just remove the IPv6 logic, I prefer to leave it in place so that
                // this function remains as similar as possible to the original function it was
                // ported from. Besides, maybe we'll need to actually make IPv6 stuff work here, so
                // we might as well keep a bit of a head start.
                // At any rate, just return the loopback interface for now. ¯\_(ツ)_/¯
                resolve("::1");
                return;
            }

            resolve(address);
        });
    });
}

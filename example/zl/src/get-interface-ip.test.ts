import os, { NetworkInterfaceInfo } from "os";

import { getInterfaceIp } from "./get-interface-ip";

// This helps gazelle to generate jest as dependency
/// <reference types="jest" />

/**
 * Returns all local IP addresses for the given family.
 * @param {string} family - IPv4 or IPv6
 * @returns {string[]} IP addresses
 */
function getLocalIpAddresses(family: "IPv4" | "IPv6") {
    return (
        Object.entries(os.networkInterfaces())
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .flatMap(([_, ifaces]) => ifaces as NetworkInterfaceInfo[])
            // .filter((iface) => iface.internal)
            .filter((iface) => iface.family == family)
            .map((iface) => iface.address)
    );
}

describe("getInterfaceIp", () => {
    const ipv4Addresses = getLocalIpAddresses("IPv4");
    const ipv6Addresses = getLocalIpAddresses("IPv6");

    it("finds an IPv4 address", async () => {
        if (!ipv4Addresses.length) {
            console.warn(
                "System has no IPv4 addresses; cannot test IPv4 functionality",
            );
            return;
        }

        const ip = await getInterfaceIp("IPv4");
        expect(ipv4Addresses).toContain(ip);
    });
    it("finds an IPv6 address", async () => {
        if (!ipv6Addresses.length) {
            console.warn(
                "System has no IPv4 addresses; cannot test IPv6 functionality",
            );
            return;
        }
        const ip = await getInterfaceIp("IPv6");
        expect(ipv6Addresses).toContain(ip);
    });
});

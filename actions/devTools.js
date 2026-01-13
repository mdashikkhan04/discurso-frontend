"use server";

import { verifyAccess } from "@/lib/server/auth";
import { deleteCollection } from "@/lib/server/data/data";

export async function wipeDataSet(dataSetName) {
    if (!(await verifyAccess(["admin"]))?.allowed) throw new Error("Unauthorized");
    await deleteCollection(dataSetName);
    console.log(`Collection ${dataSetName} wiped successfully`);
}
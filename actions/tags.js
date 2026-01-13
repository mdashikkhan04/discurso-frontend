"use server";

import { getDocs, saveDoc, deleteDoc } from "@/lib/server/data/data";

export async function getTags(type) {
    const tags = await getDocs("tags", [{ field: "type", contains: true, value: type }]);
    const strippedTags = tags.map(tag => {
        const { timestamp, ...rest } = tag;
        rest.type = tag.type?.length ? tag.type[0] : "";
        return rest;
    });
    return strippedTags;
}

export async function saveTag(tagName, tagValue, type) {
    const newTag = { name: tagName, value: tagValue, type: [type] };
    const newTagId = await saveDoc(newTag, "tags");
    newTag.id = newTagId;
    return newTag;
}

export async function deleteTag(tagId) {
    const bDeleted = await deleteDoc(tagId, "tags");
    return bDeleted;
}
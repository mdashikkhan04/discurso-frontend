import "server-only";
import { db, admin } from "@/lib/server/firebase/firebase-admin";

export async function getDoc(docId, collection) {
  try {
    const docRef = db.collection(collection).doc(docId);
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Document not found in ${collection}: [${docId}]`);
    }
    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    console.error(
      `Error fetching document from '${collection}' collection:`,
      error
    );
    throw new Error("Failed to fetch data.");
  }
}

export async function getDocs(collection, filters, selectParts, limit = null, orderByField = null, orderDirection = 'asc', startAfterDoc = null) {
  try {
    if (!filters?.length) {
      let colRef;
      if (selectParts?.length) {
        colRef = db.collection(collection).select(...selectParts);
      } else {
        colRef = db.collection(collection);
      }

      if (orderByField) {
        colRef = colRef.orderBy(orderByField, orderDirection);
      }

      if (startAfterDoc) {
        colRef = colRef.startAfter(startAfterDoc);
      }

      if (limit) {
        colRef = colRef.limit(limit);
      }

      const snapshot = await colRef.get();
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return docs;
    } else {
      let collectionRef = db.collection(collection);
      filters.forEach((filter) => {
        if (filter.contains) {
          collectionRef = collectionRef.where(
            filter.field,
            "array-contains",
            filter.value
          );
        } else if (filter.containsAny) {
          collectionRef = collectionRef.where(
            filter.field,
            "array-contains-any",
            filter.value
          );
        } else if (filter.in) {
          if (filter.field === "F_ID") filter.field = admin.firestore.FieldPath.documentId();
          collectionRef = collectionRef.where(filter.field, "in", filter.value);
        } else if (filter.not) {
          collectionRef = collectionRef.where(filter.field, "!=", filter.value);
        } else if (filter.greater) {
          collectionRef = collectionRef.where(filter.field, ">", filter.value);
        } else {
          collectionRef = collectionRef.where(filter.field, "==", filter.value);
        }
      });
      if (selectParts?.length) {
        collectionRef = collectionRef.select(...selectParts);
      }

      if (orderByField) {
        collectionRef = collectionRef.orderBy(orderByField, orderDirection);
      } else if (limit) {
        collectionRef = collectionRef.orderBy('time', 'asc');
      }

      if (startAfterDoc) {
        collectionRef = collectionRef.startAfter(startAfterDoc);
      }

      if (limit) {
        collectionRef = collectionRef.limit(limit);
      }

      const snapshot = await collectionRef.get();
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return docs;
    }
  } catch (error) {
    console.error(
      `Error fetching documents from '${collection}' collection:`,
      error
    );
    throw new Error("Failed to fetch data.");
  }
}

export async function getDocsCount(collection, filters = null) {
  try {
    let collectionRef = db.collection(collection);

    if (filters?.length) {
      filters.forEach((filter) => {
        if (filter.contains) {
          collectionRef = collectionRef.where(filter.field, "array-contains", filter.value);
        } else if (filter.containsAny) {
          collectionRef = collectionRef.where(filter.field, "array-contains-any", filter.value);
        } else if (filter.in) {
          if (filter.field === "F_ID") filter.field = admin.firestore.FieldPath.documentId();
          collectionRef = collectionRef.where(filter.field, "in", filter.value);
        } else if (filter.not) {
          collectionRef = collectionRef.where(filter.field, "!=", filter.value);
        } else if (filter.greater) {
          collectionRef = collectionRef.where(filter.field, ">", filter.value);
        } else {
          collectionRef = collectionRef.where(filter.field, "==", filter.value);
        }
      });
    }

    const snapshot = await collectionRef.count().get();
    return snapshot.data().count;
  } catch (error) {
    console.error(`Error counting documents in '${collection}' collection:`, error);
    throw new Error("Failed to count documents.");
  }
}

export async function saveDocs(docs, collection) {
  const batch = db.batch();
  for (let doc of docs) {
    let docRef;
    if (doc.id) {
      docRef = db.collection(collection).doc(doc.id);
    } else {
      docRef = db.collection(collection).doc();
    }
    batch.set(docRef, doc, { merge: false });
  }
  await batch.commit();
}

export async function saveDocsInBatches(docs, collection){
  if (!Array.isArray(docs) || docs.length === 0) return 0;

  const MAX_BATCH_SIZE = 500;
  let totalWrites = 0;

  for (let start = 0; start < docs.length; start += MAX_BATCH_SIZE) {
    const chunk = docs.slice(start, start + MAX_BATCH_SIZE);
    const batch = db.batch();
    let writesInBatch = 0;

    for (const doc of chunk) {
      if (!doc || typeof doc !== "object") continue;
      let docRef;
      if (doc.id) {
        docRef = db.collection(collection).doc(doc.id);
      } else {
        docRef = db.collection(collection).doc();
      }
      batch.set(docRef, doc, { merge: false });
      writesInBatch += 1;
    }

    if (writesInBatch === 0) {
      continue;
    }

    await batch.commit();
    totalWrites += writesInBatch;
  }

  return totalWrites;
}

export async function getLatestDoc(collection, onlyForeign) {
  let collectionRef = db.collection(collection);
  if (onlyForeign) {
    collectionRef = collectionRef.where("foreign", "==", true);
  }
  const snapshot = await collectionRef
    .orderBy("time", "desc")
    .limit(1)
    .get();
  if (snapshot.empty) return null;
  return snapshot.docs[0].data();
}

export async function updateDoc(docId, doc, collection) {
  try {
    const docRef = db.collection(collection).doc(docId);
    await docRef.update({
      ...doc,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    return docId;
  } catch (error) {
    console.error(
      `Error updating document with ID '${docId}' in '${collection}' collection:`,
      error
    );
    throw new Error("Failed to update data.");
  }
}

export async function saveDoc(doc, collection) {
  // console.log("saveDoc", collection, doc);
  try {
    let docRef;
    if (doc.id) {
      docRef = await db.collection(collection).doc(doc.id);
    } else {
      docRef = await db.collection(collection).doc();
    }
    await docRef.set(
      {
        ...doc,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: false } // Complete overwrite
    );
    return docRef.id;
  } catch (error) {
    console.error(
      `Error adding document to '${collection}' collection:`,
      error
    );
    throw new Error("Failed to add data.");
  }
}

export async function deleteDoc(docId, collection) {
  try {
    const docRef = db.collection(collection).doc(docId);
    await docRef.delete();
    return true;
  } catch (error) {
    console.error(`Error deleting document with ID '${docId}':`, error);
    throw new Error("Failed to delete document.");
  }
}

export async function deleteCollection(collectionName) {
  try {
    const batchSize = 500;
    const collectionRef = db.collection(collectionName);
    const query = collectionRef.limit(batchSize);

    return new Promise((resolve, reject) => {
      deleteQueryBatch(query, batchSize, resolve, reject);
    });
  } catch (error) {
    console.error(`Error deleting collection '${collectionName}':`, error);
    throw new Error("Failed to delete collection.");
  }
}

async function deleteQueryBatch(query, batchSize, resolve, reject) {
  try {
    const snapshot = await query.get();

    // When there are no documents left, we're done
    if (snapshot.size === 0) {
      resolve();
      return;
    }

    // Delete documents in a batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Recurse on the next process tick to avoid exploding the stack
    process.nextTick(() => {
      deleteQueryBatch(query, batchSize, resolve, reject);
    });
  } catch (error) {
    reject(error);
  }
}

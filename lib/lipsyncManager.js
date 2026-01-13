let lipsyncManagerInstance = null;
let lipsyncManagerPromise = null;

export const getLipsyncManager = async () => {
  if (typeof window === "undefined") return null;
  if (lipsyncManagerInstance) return lipsyncManagerInstance;

  if (!lipsyncManagerPromise) {
    lipsyncManagerPromise = import("wawa-lipsync")
      .then(({ Lipsync }) => {
        lipsyncManagerInstance = new Lipsync({});
        return lipsyncManagerInstance;
      })
      .catch((err) => {
        // reset so callers can retry if the import fails
        lipsyncManagerPromise = null;
        throw err;
      });
  }

  return lipsyncManagerPromise;
};

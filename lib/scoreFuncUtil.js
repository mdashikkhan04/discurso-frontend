export function testFunc(formula, params, setScoreFormulaMessage) {
  // console.log("testFunc()", formula, params);
  let missingParam = "";

  let score = getScore(formula, params, (paramId) => {
    missingParam = paramId;
  });

  if (missingParam) {
    setScoreFormulaMessage(`Parameter <${missingParam}> not found`);
    return false;
  }

  try {
    let isScoreValid = (score !== null && score !== undefined) && typeof score === "number" && Number.isFinite(score);
    if (!isScoreValid) setScoreFormulaMessage(`Non-numeric result`);
    return isScoreValid;
  } catch (error) {
    setScoreFormulaMessage(error.message);
    return false;
  }
}

export function getScore(formula, params, onMissingParam) {
  // console.log("getScore()", params);
  const formulaWithVals = formula.replace(/<(\w+)>/g, (match, varName) => {
    const foundParam = params.length ? params.find((param) => param.id === varName) : (params[varName]);
    // console.log("getScore() foundParam", foundParam, varName, params[varName]);
    if (foundParam) {
      let paramType = typeof foundParam;
      if (paramType === "number") return foundParam;
      if (paramType === "string") return `"${foundParam}"`;
      if (foundParam.dataType == "number") {
        return (foundParam.bottomLimit || foundParam.topLimit || 1);
      } else if (foundParam.dataType == "list") {
        const valParts = foundParam.listItems
          .split("<>")
          .map((cat) => cat.trim());
        return `"${valParts[0]}"`;
      } else {
        return "ParamValue";
      }
    } else {
      // console.warn("--MISSING PARAM getScore()", varName);
      if (onMissingParam) onMissingParam(varName);
      return null;
    }
  });
  // console.log("formula:\n", formulaWithVals);

  try {
    const result = new Function(formulaWithVals)();
    // console.debug("formula result:", result);
    return result;
  } catch (error) {
    // console.error(error);
    return null;
  }
}

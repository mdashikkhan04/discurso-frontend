"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion"
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  // Text,
  // LabelList,
  ReferenceLine,
  Customized
} from 'recharts';

import { fetcher } from "@/lib/fetcher";
import { showSuccessToast, showErrorToast, showWarnToast } from "@/components/toast";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import { useLoading } from "@/contexts/LoadingContext";
import { getNiceNum } from "@/lib/util"
import { Download } from 'lucide-react';
// import ResultEdit from "@/components/ResultEdit";
import ResultsTable from "@/components/ResultsTable";
import { getSviFormData } from "@/actions/events";

const metricMap = {
  expressionQuality: "Quality of Expression",
  activeParticipation: "Active Listening and Questioning",
  managingEmotions: "Managing Emotions",
  understandingValues: "Understanding Interests and Options",
  stageSetting: "Stage Setting",
  makingFirstOffer: "Making the First Offer",
  managingConcessions: "Managing Concessions",
  searchingTradeOffs: "Searching for Trade-Offs",
  generatingOptions: "Generating Creative Options",
  objectiveCriteria: "Using Objective Criteria",
  postSettlement: "Post-Settlement Settlement",
  strategicAdapt: "Strategic Adaptability",
  trustAndRelation: "Trust and Relationship Building",
  empathy: "Empathy",
  ethics: "Ethics",
};

const buildDistArray = (distObj = {}, usersObj = {}) => {
  return ["1", "2", "3", "4", "5"].map((s) => ({
    score: s,
    Count: distObj[s] || 0,
    Users: usersObj[s] || [],
  }));
};

const getOrdinalSuffix = (num) => {
  const lastDigit = num % 10;
  const lastTwoDigits = num % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return 'th';
  }

  switch (lastDigit) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
};

const CustomFeedbackTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const users = data.Users || [];
    const count = data.Count || 0;

    return (
      <div className="bg-white p-3 border border-gray-300 rounded shadow-lg min-w-md max-w-md z-50 relative">
        <p className="font-semibold text-start">{`Score: ${label}`}</p>
        {count > 0 ? (
          <div>
            <p className="text-sm text-gray-600 mb-1 text-start">{`Count: ${count}`}</p>
            <div className="text-sm">
              <p className="font-medium text-start">Participants:</p>
              <div className="max-h-[v50] overflow-y-auto">
                <div className="">
                  {users.map((user, index) => (
                    <div key={index} className="text-gray-700 text-start">- {user}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-600">No participants with this score</p>
        )}
      </div>
    );
  }
  return null;
};

function FeedbackStats({ statistics, downloadMetricCard, downloadCSV, csvDisabled }) {
  if (!statistics || !statistics.feedbacks) {
    return <p className="text-gray-600">Statistical data unavailable.</p>;
  }

  const { feedbacks, otherFeedbacks } = statistics;
  const { best, worst, average, distribution, distributionUsers } = feedbacks;
  const otherAvg = otherFeedbacks?.average ?? {};
  const metricKeys = Object.keys(metricMap);

  const header = (
    <>
      <div
        className="
      relative
      grid grid-cols-2 gap-5 items-center justify-items-center
      mb-4 border rounded-lg p-4 bg-white shadow-sm
      mx-auto max-w-max
    "
      >
        <div className="absolute top-[5px] bottom-[5px] left-1/2 w-[2px] bg-gray-400" />

        <div className="text-center">
          <h4 className="text-xl font-semibold text-gray-800">
            Highest scoring
          </h4>
          <div className="text-green-700">
            {best?.map((entry, index) => (
              <p key={index} className="text-2xl font-bold">
                {entry.rank}{getOrdinalSuffix(entry.rank)}: {entry.team}
              </p>
            ))}
          </div>
        </div>
        <div className="text-center">
          <h4 className="text-xl font-semibold text-gray-800">
            Lowest scoring
          </h4>
          <div className="text-red-700">
            {worst?.map((entry, index) => (
              <p key={index} className="text-2xl font-bold">
                {entry.rank}{getOrdinalSuffix(entry.rank)}: {entry.team}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-center">
        <Button
          className="mx-auto"
          variant="outline"
          onClick={downloadCSV}
          disabled={csvDisabled}
        >
          Download Assessment CSV
        </Button>
      </div>
    </>
  );

  const cards = (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 justify-items-center">
      {metricKeys.map((key) => {
        const thisAvg = average[key]?.toFixed(2) ?? "-";
        const baseAvg = otherAvg[key]?.toFixed(2) ?? "-";
        const isBetter = baseAvg === "-" || (thisAvg !== "-" && baseAvg !== "-" && parseFloat(thisAvg) >= parseFloat(baseAvg));
        const avgClass = (thisAvg === "-") ? "text-gray-800" : (isBetter ? "text-green-700" : "text-red-700");
        const dataArr = buildDistArray(distribution[key], distributionUsers?.[key]);

        return (
          <div
            key={key}
            id={`metric-card-${key}`}
            className="border rounded-lg p-3 bg-white shadow-sm flex flex-col items-center justify-center h-full text-center w-full"
          >
            <div className="flex items-center justify-center w-full mb-1">
              <h4 className="text-lg font-semibold leading-tight text-gray-800 flex-1">
                {metricMap[key]}
              </h4>
              <Button
                variant="link"
                onClick={() => downloadMetricCard(key)}
                className="p-0 ml-1 h-auto"
              >
                <Download className="h-4 w-4 text-gray-600" />
              </Button>
            </div>
            <p className={`text-xl font-bold ${avgClass}`}>{thisAvg}</p>
            <p className="text-md text-gray-500 mb-3">
              All-time average: <span className="text-black font-semibold">{baseAvg}</span>
            </p>
            <div className="w-full">
              <ResponsiveContainer width="100%" height={120} className="hidden md:block">
                <BarChart data={dataArr} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="score"
                    domain={[0.5, 5.5]}
                    ticks={[1, 2, 3, 4, 5]}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: "Score", position: "insideBottom", offset: -5 }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={false} width={0} />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    content={<CustomFeedbackTooltip />}
                  />
                  <Bar dataKey="Count" fill="#64748b" stroke="#475569" strokeWidth={1} />
                  {baseAvg !== "-" && (
                    <ReferenceLine
                      x={parseFloat(baseAvg)}
                      stroke="#000000"
                      strokeWidth={4}
                      strokeDasharray="3 3"
                    />
                  )}
                  {thisAvg !== "-" && (
                    <ReferenceLine
                      x={parseFloat(thisAvg)}
                      stroke="#3182ce"
                      strokeWidth={4}
                      strokeDasharray="5 5"
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
              <ResponsiveContainer width="100%" height={60} className="block md:hidden">
                <BarChart data={dataArr} margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="score"
                    axisLine={false}
                    tickLine={false}
                    label={{ value: "Score", position: "insideBottom", offset: -5 }}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={false} width={0} />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                    content={<CustomFeedbackTooltip />}
                  />
                  <Bar dataKey="Count" fill="#64748b" stroke="#475569" strokeWidth={1} />
                  {baseAvg !== "-" && (
                    <ReferenceLine
                      x={parseFloat(baseAvg)}
                      stroke="#000000"
                      strokeWidth={4}
                      strokeDasharray="3 3"
                    />
                  )}
                  {thisAvg !== "-" && (
                    <ReferenceLine
                      x={parseFloat(thisAvg)}
                      stroke="#3182ce"
                      strokeWidth={4}
                      strokeDasharray="5 5"
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center items-center mt-2 text-xs space-x-4">
                <div className="flex items-center space-x-1">
                  <svg width="16" height="2" className="inline">
                    <line x1="0" y1="1" x2="16" y2="1" stroke="#3182ce" strokeWidth="3" strokeDasharray="5 2" />
                  </svg>
                  <span className="text-blue-600 font-medium">Event average</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg width="16" height="2" className="inline">
                    <line x1="0" y1="1" x2="16" y2="1" stroke="#000000" strokeWidth="3" strokeDasharray="3 2" />
                  </svg>
                  <span className="text-black font-medium">All-time average</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-5">
      {header}
      {cards}
    </div>
  );
}

export default function EventResults({ event }) {
  // console.log("EventResults event", event);
  const [currResults, setCurrResults] = useState(null);
  const [pastResults, setPastResults] = useState(null);
  const [teams, setTeams] = useState(null);
  const [agreementsTotal, setAgreementsTotal] = useState(null);
  const [rounds, setRounds] = useState(null);
  const [cases, setCases] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sviForm, setSviForm] = useState(null);
  const { user } = useUser();
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    const fetchSviForm = async () => {
      const sviFormData = await getSviFormData();
      setSviForm(sviFormData);
    }
    if (!sviForm) fetchSviForm();
  }, [sviForm]);

  const compareResultsByTeams = (resultA, resultB) => {
    if (resultA.rank === null || resultA.rank === undefined) return 1;
    if (resultB.rank === null || resultB.rank === undefined) return -1;
    if (resultA.rank === resultB.rank) return 0;
    if (resultA.rank > resultB.rank) return 1;
    if (resultA.rank < resultB.rank) return -1;
  }

  function generateTicks(min, max, step = 0.5) {
    const start = Math.floor(Math.min(min, 0) / step) * step;
    const end = Math.ceil(Math.max(max, 0) / step) * step;
    const numSteps = Math.round((end - start) / step);
    return Array.from({ length: numSteps + 1 }, (_, i) =>
      Number((start + i * step).toFixed(2))
    );
  }

  const getHistData = (data) => {
    let minVal = Math.min(...data);
    let maxVal = Math.max(...data);
    const dataRange = maxVal - minVal;
    const n = data.length;
    let mean = data.reduce((sum, value) => sum + value, 0) / n;
    const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (n - 1);
    let std = Math.sqrt(variance);
    const sortedData = [...data].sort((a, b) => a - b);
    const mid = Math.floor(n / 2);
    let median = n % 2 !== 0 ? sortedData[mid] : (sortedData[mid - 1] + sortedData[mid]) / 2;
    let bins = [{ x: `${getNiceNum(minVal, 2)} - ${getNiceNum(maxVal, 2)}`, y: data.length }];
    if (std > 0 && dataRange > 0) {
      const binWidth = 3.5 * std / Math.pow(n, 1 / 3);
      let numBins = Math.floor(dataRange / binWidth);
      const minBins = 4, maxBins = 10;
      numBins = Math.min(Math.max(minBins, numBins), maxBins);
      const actualBinWidth = dataRange / numBins;
      bins = Array.from({ length: numBins }, (_, i) => ({
        x: `${getNiceNum((minVal + i * actualBinWidth), 2)} - ${getNiceNum((minVal + (i + 1) * actualBinWidth), 2)}`,
        y: 0
      }));
      data.forEach(value => {
        const index = Math.min(
          Math.floor((value - minVal) / actualBinWidth),
          numBins - 1
        );
        bins[index].y++;
      });
    }
    return { bins, std, mean, minVal, maxVal, median };
  }

  const getChartData = (teamResults, caseId, cases = cases) => {
    const caseData = cases[caseId];
    const isScorable = caseData.scorable;
    const round = teamResults[0].round;

    const distCharts = generateDistributionCharts(teamResults, caseData, round);

    const teamMap = teamResults.reduce((map, result) => {
      map[result.team] = result;
      return map;
    }, {});

    const chartMetrics = processTeamResults(teamResults, teamMap, isScorable);

    const scoreChartData = buildScoreChart(chartMetrics.scores, caseData, cases[caseId], round);
    const relSubChartData = buildRelSubChart(chartMetrics.relSub, isScorable, chartMetrics.bounds, round);

    return {
      distCharts,
      scoreChart: scoreChartData,
      relSubChart: relSubChartData
    };
  }

  const generateDistributionCharts = (teamResults, caseData, round) => {
    const distributionParams = Object.keys(caseData.params).filter(param =>
      caseData.params[param].dataType === "number" || caseData.params[param].dataType === "list"
    );

    return distributionParams.map(param => {
      const isNumeric = caseData.params[param].dataType === "number";
      const data = teamResults
        .map(result => isNumeric ? parseFloat(result.agreement[param]) : result.agreement[param])
        .filter(val => isNumeric ? !isNaN(val) : val);

      if (data.length === 0) return null;

      let bins, chartStats = {};

      if (isNumeric) {
        const histData = getHistData(data);
        bins = histData.bins;
        chartStats = {
          mean: getNiceNum(histData.mean, 2),
          std: getNiceNum(histData.std, 2),
          min: getNiceNum(histData.minVal, 2),
          max: getNiceNum(histData.maxVal, 2),
          median: getNiceNum(histData.median, 2)
        };
      } else {
        const counts = data.reduce((acc, value) => {
          acc[value] = (acc[value] || 0) + 1;
          return acc;
        }, {});

        bins = Object.entries(counts).map(([key, count]) => ({ x: key, y: count }));
      }

      return {
        name: caseData.params[param].name,
        ranges: bins,
        id: `chart-${round}-${param}`,
        isNumeric,
        ...chartStats
      };
    }).filter(Boolean);
  }

  const processTeamResults = (teamResults, teamMap, isScorable) => {
    const scores = {};
    const relSub = isScorable ? {} : [];
    const bounds = {
      maxScoreAbsY: 0,
      maxRelSubAbsY: 0,
      maxRelSubRel: -Infinity,
      minRelSubRel: Infinity,
      maxRelSubSub: -Infinity,
      minRelSubSub: Infinity
    };

    for (const result of teamResults) {
      if (result.side === "a") {
        processScoreData(result, teamMap, scores, bounds);
      }

      if (isScorable) {
        processRelSubData(result, relSub, bounds);
      } else if (Number.isFinite(result?.surveyStats?.relScore)) {
        relSub.push(result.surveyStats.relScore);
      }
    }

    return { scores, relSub, bounds };
  }

  const processScoreData = (result, teamMap, scores, bounds) => {
    const opponent = teamMap[result.opponent];
    if (!opponent) return;

    if (result.disqualified || opponent.disqualified) return;

    const xScore = result.agreeStats?.score ?? result.agreeStats?.aScore;
    const yScore = opponent.agreeStats?.score ?? opponent.agreeStats?.bScore;

    if (!Number.isFinite(xScore) && !Number.isFinite(yScore)) return;

    const x = Number.isFinite(xScore) ? xScore : 0;
    const y = Number.isFinite(yScore) ? yScore : 0;
    const teamPair = `${result.team} / ${opponent.team}`;
    const scoreKey = `${x}_${y}`;

    if (!scores[scoreKey]) {
      scores[scoreKey] = { ateams: [teamPair], x, y };
    } else if (!scores[scoreKey].ateams.includes(teamPair)) {
      scores[scoreKey].ateams.push(teamPair);
    }

    bounds.maxScoreAbsY = Math.max(bounds.maxScoreAbsY, Math.abs(y));
  }

  const processRelSubData = (result, relSub, bounds) => {
    const relScoreNum = Number.isFinite(result?.surveyStats?.relScore)
      ? parseFloat(getNiceNum(result.surveyStats.relScore, 2))
      : null;
    const subScoreNum = Number.isFinite(result?.agreeStats?.subScore)
      ? parseFloat(getNiceNum(result.agreeStats.subScore, 2))
      : null;

    if (relScoreNum === null && subScoreNum === null) return;

    const relScore = relScoreNum ?? 0;
    const subScore = subScoreNum ?? 0;
    const relSubKey = `${relScore}_${subScore}`;

    if (!relSub[relSubKey]) {
      relSub[relSubKey] = { ateams: [result.team], x: relScore, y: subScore };
    } else if (!relSub[relSubKey].ateams.includes(result.team)) {
      relSub[relSubKey].ateams.push(result.team);
    }

    bounds.maxRelSubAbsY = Math.max(bounds.maxRelSubAbsY, Math.abs(subScore));
    bounds.maxRelSubRel = Math.max(bounds.maxRelSubRel, relScore);
    bounds.minRelSubRel = Math.min(bounds.minRelSubRel, relScore);
    bounds.maxRelSubSub = Math.max(bounds.maxRelSubSub, subScore);
    bounds.minRelSubSub = Math.min(bounds.minRelSubSub, subScore);
  }

  const buildScoreChart = (scores, caseData, caseInfo, round) => {
    const scoreData = Object.values(scores);
    if (scoreData.length === 0) return null;

    const xRangeBuff = Math.round(((Math.abs(caseData.maxScoreA - caseData.minScoreA) * 0.1) / 10)) * 10;
    const yRangeBuff = Math.round(((Math.abs(caseData.maxScoreB - caseData.minScoreB) * 0.1) / 10)) * 10;

    return {
      id: `chart-${round}-scores`,
      maxX: caseData.maxScoreA + xRangeBuff,
      minX: caseData.minScoreA - xRangeBuff,
      maxY: caseData.maxScoreB + yRangeBuff,
      minY: caseData.minScoreB - yRangeBuff,
      data: scoreData,
      maxLenY: Math.max(...scoreData.map(d => Math.abs(d.y))).toString().length,
      labels: {
        x: `${caseInfo.aName} Score`,
        y: `${caseInfo.bName} Score`
      }
    };
  }

  const buildRelSubChart = (relSub, isScorable, bounds, round) => {
    let chartData;

    if (isScorable) {
      chartData = Object.values(relSub);
      if (chartData.length === 0) return null;
    } else {
      if (relSub.length === 0) return null;
      chartData = getHistData(relSub);
    }

    return {
      id: `chart-${round}-rel_sub`,
      data: isScorable ? chartData : { ranges: chartData?.bins },
      scorable: isScorable,
      maxLenY: bounds.maxRelSubAbsY.toString().length,
      labels: {
        x: "Relational Score",
        y: "Substantive Score"
      },
      isNumeric: true,
      ticks: {
        y: generateTicks(bounds.minRelSubSub, bounds.maxRelSubSub),
        x: generateTicks(bounds.minRelSubRel, bounds.maxRelSubRel)
      }
    };
  }

  const CustomScatterTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const aAxis = payload.map(item => ({ name: item.name, value: item.value }));
    let sTitle;
    if (payload[0]?.payload.labelText) {
      sTitle = payload[0]?.payload.labelText;
    } else {
      sTitle = `Teams: ${payload[0]?.payload.ateams.join(", ")}`;
    }
    return (
      <div className="bg-white p-2 border-gray-300 rounded shadow">
        <p className="text-sm text-gray-700 font-bold">{sTitle}</p>
        {aAxis.map((axis, index) => (
          <p key={index} className="text-sm text-gray-500">
            {axis.name}: {getNiceNum(axis.value, 2)}
          </p>
        ))}
      </div>
    )
  }

  const ParetoLine = ({ points, xAxisMap, yAxisMap }) => {
    // console.log("ParetoLine", points, xAxisMap, yAxisMap)
    if (points.length < 3) return null;

    const [p1, p2, p3] = points;
    const xScale = xAxisMap['0']?.scale;
    const yScale = yAxisMap['0']?.scale;

    const x1 = xScale(p1.x);
    const y1 = yScale(p1.y);
    const x2 = xScale(p2.x);
    const y2 = yScale(p2.y);
    const x3 = xScale(p3.x);
    const y3 = yScale(p3.y);

    const d = `M ${x1},${y1} Q ${x2},${y2} ${x3},${y3}`;

    return (
      <path
        d={d}
        stroke="blue"
        strokeWidth={2}
        fill="none"
      />
    );
  };

  const getResultsByRound = (results, cases) => {
    let pastResults = {};
    let currResults = {};
    results.forEach((result) => {
      if (result.round === event.currentRound) {
        if (!currResults.teams) {
          currResults.teams = [];
          currResults.caseId = result.caseId;
          currResults.vsAI = result.vsAI;
          currResults.aName = cases[result.caseId].aName;
          currResults.bName = cases[result.caseId].bName;
        }
        currResults.teams.push(result);
      } else {
        if (!pastResults[result.round]) {
          pastResults[result.round] = { teams: [] };
          pastResults[result.round].caseId = result.caseId;
          pastResults[result.round].vsAI = result.vsAI;
          pastResults[result.round].aName = cases[result.case?.id || result.caseId].aName;
          pastResults[result.round].bName = cases[result.case?.id || result.caseId].bName;
        }
        pastResults[result.round].teams.push(result);
      }
    });
    if (currResults?.teams?.length) {
      currResults.teams.sort(compareResultsByTeams);
      currResults.charts = getChartData(currResults.teams, currResults.caseId, cases);
    }
    const pastRounds = Object.keys(pastResults);
    if (pastRounds.length) {
      for (let round of pastRounds) {
        if (pastResults[round]?.teams?.length) {
          pastResults[round].teams.sort(compareResultsByTeams);
          pastResults[round].charts = getChartData(pastResults[round].teams, pastResults[round].caseId, cases);
        }
      }
    }
    return { currResults, pastResults };
  };


  const fetchResults = async () => {
    setIsLoading(true);
    try {
      const response = await fetcher.get(
        `/api/data/results/${event.id}`,
        user
      );
      if (response.ok) {
        // console.log("response.result", response.result);
        let { currResults, pastResults } = getResultsByRound(response.result.results, response.result.cases);
        // console.debug("results:", response.result);
        // console.debug("currResults:", currResults);
        // console.debug("pastResults:", pastResults);
        if (currResults?.teams) event.agreementsReached = getAgreementsReached(currResults);
        setCurrResults(currResults);
        setPastResults(pastResults);
        setTeams(response.result.teams);
        setRounds(response.result.rounds);
        setAgreementsTotal(response.result.agreementsTotal);
        setCases(response.result.cases);
        setCurrentRound(event.currentRound);
      } else {
        console.error("Failed to fetch results:", response.error);
      }
    } catch (error) {
      console.error("Error during fetch:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    fetchResults();
  }, [user]);

  const getAgreementsReached = (results) => {

    let agreementsReached = 0;
    results.teams.forEach((result) => {
      if (result.pending) return;
      if (!result.madeDeal) return;
      if (result.round !== event.currentRound) return;
      agreementsReached++;
    });
    return agreementsReached;
  };

  const getResultsCSV = (byTeam = true, round) => {
    let aResults = round ? (round === currentRound ? currResults.teams : pastResults[round].teams) : currResults.teams;
    if (!aResults) return;
    const bScorable = cases[aResults[0]?.caseId].scorable;

    let headers = ["round", "team", "side", "opponent"];
    if (!byTeam) headers.push("email", "name");

    const allKeys = [
      ...(bScorable ? [
        ...Object.keys(aResults[0].agreement),
        ...Object.keys(aResults[0].agreeStats)
      ] : []),
      ...Object.keys(aResults[0].survey),
      ...Object.keys(aResults[0].surveyStats),
      "comment"
    ];

    const buildRow = (result, participant = {}) => [
      `"${result.round}"`,
      `"${result.team}"`,
      `"${result.side}"`,
      `"${result.opponent}"`,
      ...(!byTeam ? [`"${participant.email || ''}"`, `"${participant.name || ''}"`] : []),
      ...allKeys.map(key => {
        const value = result.agreement[key] ?? result.survey[key] ?? result.agreeStats[key] ?? result.surveyStats[key] ?? result[key] ?? "";
        if (value === null || value === undefined) return "";
        return `"${value.toString().replace(/"/g, "''")}"`;
      })
    ].join(",");

    let csvRows = [];
    if (byTeam) {
      csvRows = aResults.map(result => buildRow(result));
    } else {
      csvRows = aResults.flatMap(result => {
        const teamKey = result.teamId || result.team;
        const participants = Array.isArray(teams[teamKey]) ? teams[teamKey] : [];
        if (participants.length === 0) {
          return [buildRow(result, {})];
        }
        return participants.map(participant => buildRow(result, participant));
      });
    }

    let csvContent = [headers.concat(allKeys.map(key => `"${key}"`)).join(",")]
      .concat(csvRows)
      .join("\n");

    return csvContent;
  };

  const handleDownload = (filename, content) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const downloadResultsByTeamCSV = (round) => {
    const csvContent = getResultsCSV(true, round);
    handleDownload(`${event.title}-${round}-team_results.csv`, csvContent);
  };

  const downloadResultsByNegotiatorCSV = (round) => {
    const csvContent = getResultsCSV(false, round);
    handleDownload(`${event.title}-${round}-results.csv`, csvContent);
  };

  const getAssessmentCSV = (round) => {
    const rd = round ? rounds?.[round] : rounds?.[event.currentRound];
    const data = rd?.feedbackData?.feedbacks;
    const teams = data?.byTeam;
    if (!teams?.length) return null;
    const categories = data?.categories || Object.keys(metricMap);
    const header = ["rank", "team", ...categories.map(k => (metricMap[k] || k).replaceAll(" ", "_").toLowerCase())];
    const rows = teams.map(t => [
      t.rank,
      `"${(t.team || "").toString().replace(/"/g, "''")}"`,
      ...categories.map(k => t.scores?.[k] ?? "")
    ].join(","));
    return [header.join(","), ...rows].join("\n");
  };

  const downloadAssessmentCSV = (round) => {
    const csv = getAssessmentCSV(round);
    if (!csv) return;
    handleDownload(`${event.title}-${round || event.currentRound}-assessment-summary.csv`, csv);
  };


  const downloadMetricCard = async (metricKey) => {
    const element = document.getElementById(`metric-card-${metricKey}`);
    if (!element) {
      console.error("Metric card element not found.");
      return;
    }

    showLoading();

    try {
      if (typeof window.html2canvas === 'function') {
        const canvas = await window.html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true
        });
        const dataURL = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `feedback-${metricKey}-${event.title || 'event'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error('html2canvas library not loaded');
      }
    } catch (error) {
      console.error("Error downloading metric card:", error);
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.outline = '3px solid #3182ce';
      element.style.outlineOffset = '2px';
      showWarnToast("Please use your browser's screenshot tool to capture this highlighted metric card.");
      setTimeout(() => {
        element.style.outline = '';
        element.style.outlineOffset = '';
      }, 3000);
    }

    hideLoading();
  };

  const updateResult = async (result) => {
    if (confirm(`Update Team ${result.team} result in round ${result.round}?`) === false) return;
    const dataToSend = {
      result: {
        id: result.id,
        agreement: result.agreement,
        survey: result.survey,
      }
    }
    if (!dataToSend.result.id) {
      dataToSend.result = { ...dataToSend.result, ...result };
    }
    if (result.madeDeal !== undefined && result.madeDeal !== null) {
      dataToSend.result.madeDeal = result.madeDeal
      dataToSend.result.final = result.final
    }
    // console.log("dataToSend", dataToSend);
    showLoading();
    const bUpdatedResults = await fetcher.post(`/api/data/results/${result.eventId}`, dataToSend, user);
    hideLoading();
    if (bUpdatedResults.ok) {
      showWarnToast("Results updated. Statistical data is now invalid! Refresh!")
    } else {
      showErrorToast("Failed to update results.");
    }
  }

  const deleteResult = async (result, round, index) => {
    if (confirm(`DELETE Team ${result.team} result in round ${result.round}?`) === false) return;
    const dataToSend = { result: { id: result.id, delete: true } }
    showLoading();
    const bDeletedResults = await fetcher.post(`/api/data/results/${result.eventId}`, dataToSend, user);
    hideLoading();
    if (bDeletedResults.ok) {
      showWarnToast("Results deleted. Statistical data is now invalid! Refresh!")
      if (round) {
        if (round === currentRound) {
          const resultIndex = currResults.teams.findIndex(r => r.id === result.id);
          if (resultIndex !== -1) {
            setCurrResults(prev => {
              const updatedTeams = [...prev.teams];
              updatedTeams.splice(resultIndex, 1);
              return { ...prev, teams: updatedTeams };
            });
          }
        } else {
          const resultIndex = pastResults[round].teams.findIndex(r => r.id === result.id);
          if (resultIndex !== -1) {
            setPastResults(prev => {
              const updatedPast = { ...prev };
              updatedPast[round].teams.splice(resultIndex, 1);
              return updatedPast;
            });
          }
        }
      }
    } else {
      showErrorToast("Failed to delete results.");
    }
  }

  const downloadChart = (chartId) => {
    const element = document.getElementById(chartId);
    if (element) {
      showLoading();
      const svgURL = new XMLSerializer().serializeToString(element);
      const img = new Image();
      const svgBlob = new Blob([svgURL], { type: 'image/svg+xml' });
      const svgURLObject = URL.createObjectURL(svgBlob);
      img.src = svgURLObject;
      img.onerror = (err) => {
        console.error("Error loading SVG image", err);
        hideLoading();
      };
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (img.width && img.height) {
          canvas.width = img.width;
          canvas.height = img.height;
        } else {
          const rect = element.getBoundingClientRect();
          canvas.width = rect.width;
          canvas.height = rect.height;
        }
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL("image/jpeg");
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `${chartId}.jpeg`;
        document.body.appendChild(link);
        hideLoading();
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(svgURLObject);
      };
    } else {
      console.error("Element with the provided chartId not found.");
    }
  };

  const regenerateFeedSumm = async (round) => {
    if (round) {
      if (confirm(`Regenerate feedback summary for round ${round}?`) === false) return;
    } else {
      if (confirm(`Regenerate feedback summary for all rounds?`) === false) return;
    }
    showLoading();
    const roundIndex = round ? parseInt(round) - 1 : -1;
    const resp = await fetcher.post(`/api/data/summary/${event.id}/${roundIndex}`, { allRounds: !Boolean(round) }, user);
    hideLoading();
    if (resp.ok) {
      showWarnToast("Feedback summary regenerated. Refresh to see changes.");
    } else {
      showErrorToast(resp.error || "Failed to regenerate feedback summary.");
    }
  }


  return (
    <div className="flex flex-col min-h-screen p-2">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <h1 className="text-xl font-bold text-gray-800">Fetching results...</h1>
        </div>
      ) : (
        <div>
          {!currResults?.teams?.length && (!pastResults || !pastResults["1"]) && (
            <div className="flex justify-center items-center h-64">
              <h1 className="text-xl font-bold text-gray-800">No results yet...</h1>
            </div>
          )}
          {(currResults?.teams?.length || 0) > 0 && (
            <section className="mb-8">
              <Card className="border rounded-lg p-2 bg-blue-50">
                <h3 className="text-2xl font-bold text-blue-700 text-center mb-2 md:mb-4">
                  Current Round - {rounds[event.currentRound]?.case?.title || event.currentRound}
                </h3>
                <div className=" relative grid grid-cols-1 md:grid-cols-2 gap-y-4 md:gap-x-10 items-center justify-items-center mb-6 w-max mx-auto">
                  <div className="hidden md:block absolute top-[2px] bottom-[2px] left-1/2 w-[3px] bg-gray-400" />

                  <div className="flex flex-col items-center text-center">
                    <h3 className="text-xl font-semibold text-gray-800">Agreements Submitted</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {event.agreementsReached ?? "?"} / {agreementsTotal ?? "?"}
                    </p>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <h3 className="text-xl font-semibold text-gray-800">Time Remaining</h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {event.timeLeft} {event.timeLeftUnits}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 items-center mt-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="mx-auto" disabled={!currResults?.teams.length}>
                        Download Results
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => downloadResultsByTeamCSV(event.currentRound)}>
                        By Team
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadResultsByNegotiatorCSV(event.currentRound)}>
                        By Negotiator
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {(currResults.charts?.scoreChart ||
                  currResults.charts?.relSubChart ||
                  currResults.charts?.distCharts?.length !== 0
                ) && (
                    <Accordion type="single" collapsible>
                      <AccordionItem value="scores">
                        <AccordionTrigger className="text-lg font-semibold">Score statistics</AccordionTrigger>
                        <AccordionContent>
                          {currResults.charts?.scoreChart && (
                            <>
                              <div className="flex items-center justify-center space-x-2">
                                <h1 className="text-lg font-bold">Scores</h1>
                                <Button
                                  variant="link"
                                  onClick={() => downloadChart(currResults.charts.scoreChart.id)}
                                  className="p-0"
                                >
                                  <Download className="h-12 w-12 text-gray-800 font-bold" />
                                </Button>
                              </div>
                              {process.env.NEXT_PUBLIC_ENVIRON !== "prod" && (
                                <div className="flex flex-col items-center justify-center space-x-2 font-bold text-orange-700">
                                  <p>Score range for case {rounds[currResults.teams[0].round]?.case?.id}</p>
                                  <div className="flex flex-col md:flex-row items-center justify-center space-x-2 font-semibold text-orange-600">
                                    <p>Min A (x) score: {JSON.stringify(cases[rounds[currResults.teams[0].round]?.case?.id]?.minScoreA)}</p>
                                    <span className="hidden md:inline">|</span>
                                    <p>Max A (x) score: {JSON.stringify(cases[rounds[currResults.teams[0].round]?.case?.id]?.maxScoreA)}</p>
                                    <span className="hidden md:inline">|</span>
                                    <p>Min B (y) score: {JSON.stringify(cases[rounds[currResults.teams[0].round]?.case?.id]?.minScoreB)}</p>
                                    <span className="hidden md:inline">|</span>
                                    <p>Max B (y) score: {JSON.stringify(cases[rounds[currResults.teams[0].round]?.case?.id]?.maxScoreB)}</p>
                                  </div>
                                </div>
                              )}
                              <ResponsiveContainer width="100%" height={400}>
                                <ScatterChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis
                                    type="number"
                                    dataKey="x"
                                    name={currResults.charts.scoreChart.labels.x}
                                    domain={[currResults.charts.scoreChart.minX, currResults.charts.scoreChart.maxX]}
                                    label={{ value: currResults.charts.scoreChart.labels.x, dy: 20, position: "center", style: { fontWeight: "bold", fill: "#000" } }}
                                  />
                                  <YAxis
                                    type="number"
                                    dataKey="y"
                                    name={currResults.charts.scoreChart.labels.y}
                                    domain={[currResults.charts.scoreChart.minY, currResults.charts.scoreChart.maxY]}
                                    label={{
                                      value: currResults.charts.scoreChart.labels.y,
                                      angle: -90,
                                      dx: currResults.charts.scoreChart.maxLenY * -5 - 10,
                                      style: { fontWeight: "bold", fill: "#000" }
                                    }} />
                                  <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<CustomScatterTooltip />} />
                                  {currResults?.charts?.scoreChart?.data && (
                                    <Scatter data={currResults.charts.scoreChart.data}
                                      fill="black"
                                      shape="cross"
                                    />
                                  )}
                                </ScatterChart>
                              </ResponsiveContainer>
                            </>
                          )}

                          {currResults.charts.relSubChart && (
                            <>
                              <div className="flex items-center justify-center space-x-2 mt-6">
                                <h1 className="text-lg font-bold">Relational VS Substantive</h1>
                                <Button
                                  variant="link"
                                  onClick={() => downloadChart(results.charts.relSubChart.id)}
                                  className="p-0"                                 >
                                  <Download className="h-12 w-12 text-gray-800 font-bold" /> {/* Adjust icon size and color */}
                                </Button>
                              </div>
                              <ResponsiveContainer width="100%" height={400}>
                                {currResults.charts.relSubChart.scorable ? (
                                  <ScatterChart id={currResults.charts.relSubChart.id} margin={{ top: 20, right: 30, left: 30, bottom: 20 }} >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                      type="number"
                                      dataKey="x"
                                      name={currResults.charts.relSubChart.labels.x}
                                      domain={["dataMin", "dataMax"]}
                                      axisLine={false}
                                      label={{ value: currResults.charts.relSubChart.labels.x, dy: 20, position: "center", style: { fontWeight: "bold", fill: "#000" } }}
                                    />
                                    <YAxis
                                      type="number"
                                      dataKey="y"
                                      name={currResults.charts.relSubChart.labels.y}
                                      domain={["dataMin", "dataMax"]}
                                      axisLine={false}
                                      label={{
                                        value: currResults.charts.relSubChart.labels.y,
                                        angle: -90,
                                        dx: currResults.charts.relSubChart.maxLenY * -5 - 10,
                                        style: { fontWeight: "bold", fill: "#000" }
                                      }} />
                                    <ReferenceLine x={0} stroke="black" strokeWidth={1} />
                                    <ReferenceLine y={0} stroke="black" strokeWidth={1} />
                                    <Tooltip
                                      cursor={{ strokeDasharray: "3 3" }} content={<CustomScatterTooltip />}
                                    />
                                    {currResults?.charts?.relSubChart?.data && (
                                      <Scatter data={currResults.charts.relSubChart.data}
                                        shape="dot"
                                        fill="red"
                                      />
                                    )}
                                  </ScatterChart>
                                ) : (
                                  <BarChart id={currResults.charts.relSubChart.id} data={currResults.charts.relSubChart.data.ranges} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                      dataKey="x"
                                      name="Range"
                                      label={{ value: "Ranges", dy: 20, position: "center", style: { fontWeight: "bold", fill: "black" } }}
                                    />
                                    <YAxis
                                      dataKey="y"
                                      name="Count"
                                      label={{ value: "Count", dy: 20, angle: -90, dx: -20, style: { fontWeight: "bold", fill: "black" } }}
                                    />
                                    <Tooltip cursor={{ fill: "lightgray" }} content={({ active, payload }) => {
                                      if (!active || !payload || !payload[0]?.payload) return null;
                                      const sRange = payload[0].payload.x;
                                      const sCount = payload[0].payload.y;
                                      return (
                                        <div className="bg-white p-2 border-gray-300 rounded shadow">
                                          <p className="text-sm text-gray-700 font-bold">Range: {sRange}</p>
                                          <p className="text-sm text-gray-700 font-bold">Count: {sCount}</p>
                                        </div>
                                      )
                                    }} />
                                    <Bar dataKey="y" fill="darkgray" stroke="gray" strokeWidth={2} />
                                  </BarChart>
                                )}
                              </ResponsiveContainer>
                            </>
                          )}
                          {currResults.charts.distCharts.map((distChart, index) => {
                            return (
                              <div key={index} className="mt-6">
                                <h1 className="text-center text-lg font-bold">{distChart.name}</h1>
                                {distChart.isNumeric && (
                                  <h2 className="text-center text-md font-semibold">
                                    {[
                                      distChart.mean && `Mean = ${distChart.mean}`,
                                      distChart.std && `Std. Dev. = ${distChart.std}`,
                                      distChart.min && `Min = ${distChart.min}`,
                                      distChart.median && `Median = ${distChart.median}`,
                                      distChart.max && `Max = ${distChart.max}`,
                                    ]
                                      .filter(Boolean)
                                      .join(' | ')}
                                  </h2>
                                )}
                                <ResponsiveContainer width="100%" height={400}>
                                  <BarChart data={distChart.ranges} margin={{ top: 20, right: 30, left: 30, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                      dataKey="x"
                                      name="Range"
                                      label={{ value: "Ranges", dy: 20, position: "center", style: { fontWeight: "bold", fill: "black" } }}
                                    />
                                    <YAxis
                                      dataKey="y"
                                      name="Count"
                                      label={{ value: "Count", dy: 20, angle: -90, dx: -20, style: { fontWeight: "bold", fill: "black" } }}
                                    />
                                    <Tooltip cursor={{ fill: "lightgray" }} content={({ active, payload }) => {
                                      if (!active || !payload || !payload[0]?.payload) return null;
                                      const sRange = payload[0].payload.x;
                                      const sCount = payload[0].payload.y;
                                      return (
                                        <div className="bg-white p-2 border-gray-300 rounded shadow">
                                          <p className="text-sm text-gray-700 font-bold">Range: {sRange}</p>
                                          <p className="text-sm text-gray-700 font-bold">Count: {sCount}</p>
                                        </div>
                                      )
                                    }} />
                                    <Bar dataKey="y" fill="darkgray" stroke="gray" strokeWidth={2} />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            )
                          })}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}

                {currResults?.teams.length && (
                  <Accordion type="single" collapsible>
                    <AccordionItem value="leaderboard">
                      <AccordionTrigger className="text-lg font-semibold">Leaderboard</AccordionTrigger>
                      <AccordionContent>
                        {currResults.vsAI ? (
                          <ResultsTable results={currResults.teams} cases={cases} onUpdate={updateResult} onDelete={deleteResult} sviForm={sviForm} aiRound={currResults.vsAI} dealParams={cases[rounds[currResults.teams[0].round]?.case?.id]?.params} />
                        ) : (
                          <>
                            <h1 className="text-center text-lg font-bold mb-2">{currResults.aName}</h1>
                            <ResultsTable results={currResults.teams.filter(team => team.side === "a")} cases={cases} onUpdate={updateResult} onDelete={deleteResult} sviForm={sviForm} aiRound={currResults.vsAI} dealParams={cases[rounds[currResults.teams[0].round]?.case?.id]?.params} />

                            <h1 className="text-center text-lg font-bold mb-2 mt-6">{currResults.bName}</h1>
                            <ResultsTable results={currResults.teams.filter(team => team.side === "b")} cases={cases} onUpdate={updateResult} onDelete={deleteResult} sviForm={sviForm} aiRound={currResults.vsAI} dealParams={cases[rounds[currResults.teams[0].round]?.case?.id]?.params} />
                          </>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </Card>
            </section>
          )}

          <section>
            {currResults?.teams?.length && pastResults?.["1"] && (
              <h2 className="text-2xl font-bold text-gray-700 mb-6">
                Previous Rounds
              </h2>
            )}
            <div className="grid grid-cols-1 gap-6">
              {pastResults && Object.entries(pastResults).map(([round, results]) => {
                return (
                  <Card key={round} className="border rounded-lg p-2 md:p-6 bg-gray-50">

                    <div className="flex flex-col items-center text-center mb-4">
                      <h3 className="text-2xl font-bold text-gray-800">
                        Round {round}
                        {rounds[round]?.case?.title && (
                          <>
                            - <span className="text-blue-600"> {rounds[round].case.title}</span>
                          </>
                        )}
                      </h3>
                      <p className="mt-1 text-md text-gray-600">
                        <span className="font-semibold">{results.teams.filter(r => !r.disqualified).length}</span> Results
                      </p>
                    </div>

                    <div className="relative grid grid-cols-1 md:grid-cols-2 gap-y-4 md:gap-x-10 items-center justify-items-center mb-6 w-max mx-auto">
                      <div className="hidden md:block absolute top-[2px] bottom-[2px] left-1/2 w-[3px] bg-gray-400" />
                      <div className="flex flex-col items-center">
                        <span className="text-md uppercase text-gray-500">Start Time</span>
                        <span className="mt-1 text-lg font-medium text-gray-700">
                          {new Date(rounds[round].startTime).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-md uppercase text-gray-500">End Time</span>
                        <span className="mt-1 text-lg font-medium text-gray-700">
                          {new Date(rounds[round].endTime).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 items-center mt-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="mx-auto" disabled={!pastResults[round]?.teams} variant="outline">
                            Download Results
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => downloadResultsByTeamCSV(round)}>
                            By Team
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadResultsByNegotiatorCSV(round)}>
                            By Negotiator
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {rounds[round].aiRound && (
                      <Accordion type="single" collapsible>
                        <AccordionItem value="feedbacks">
                          <AccordionTrigger className="text-lg font-semibold">Competency Assesment</AccordionTrigger>
                          <AccordionContent>
                            {rounds[round].feedbackSumm ? (
                              <>
                                <p className="mb-6 text-md leading-relaxed text-gray-800 border rounded-lg p-3 bg-white shadow-sm">
                                  {rounds[round].feedbackSumm}
                                </p>

                                <FeedbackStats statistics={rounds[round].feedbackData} downloadMetricCard={downloadMetricCard} downloadCSV={() => downloadAssessmentCSV(round)} csvDisabled={!rounds[round]?.feedbackData?.feedbacks?.byTeam?.length} />
                              </>
                            ) : (
                              <p className="text-gray-600">
                                Feedbacks overview pending, it might take a few minutes…
                              </p>
                            )}
                              <div className="items-start justify-start mt-4 ml-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button className="mx-auto text-orange-600" variant="ghost">
                                      Regenerate feedback summaries
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => regenerateFeedSumm(round)}>
                                      For this round
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => regenerateFeedSumm()}>
                                      For this event
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}

                    {(results.charts?.scoreChart ||
                      results.charts?.relSubChart ||
                      results.charts?.distCharts?.length !== 0
                    ) && (
                        <Accordion type="single" collapsible>
                          <AccordionItem value="scores">
                            <AccordionTrigger className="text-lg font-semibold">Score statistics</AccordionTrigger>
                            <AccordionContent>

                              {results.charts.scoreChart && (
                                <>
                                  <div className="flex items-center justify-center space-x-2">
                                    <h1 className="text-lg font-bold">Scores</h1>
                                    <Button
                                      variant="link"
                                      onClick={() => downloadChart(results.charts.scoreChart.id)}
                                      className="p-0"
                                    >
                                      <Download className="h-12 w-12 text-gray-800 font-bold" /> {/* Adjust icon size and color */}
                                    </Button>
                                  </div>
                                  {process.env.NEXT_PUBLIC_ENVIRON !== "prod" && (
                                    <div className="flex flex-col items-center justify-center space-x-2 font-bold text-orange-700">
                                      <p>Score range for case {rounds[round]?.case?.id}</p>
                                      <div className="flex flex-col md:flex-row items-center justify-center space-x-2 font-semibold text-orange-600">
                                        <p>Min A (x) score: {JSON.stringify(cases[rounds[round]?.case?.id]?.minScoreA)}</p>
                                        <span className="hidden md:inline">|</span>
                                        <p>Max A (x) score: {JSON.stringify(cases[rounds[round]?.case?.id]?.maxScoreA)}</p>
                                        <span className="hidden md:inline">|</span>
                                        <p>Min B (y) score: {JSON.stringify(cases[rounds[round]?.case?.id]?.minScoreB)}</p>
                                        <span className="hidden md:inline">|</span>
                                        <p>Max B (y) score: {JSON.stringify(cases[rounds[round]?.case?.id]?.maxScoreB)}</p>
                                      </div>
                                    </div>
                                  )}
                                  <ResponsiveContainer width="100%" height={400}>
                                    <ScatterChart id={results.charts.scoreChart.id} margin={{ top: 20, right: 30, left: 30, bottom: 20 }} >
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis
                                        type="number"
                                        dataKey="x"
                                        name={results.charts.scoreChart.labels.x}
                                        domain={[results.charts.scoreChart.minX, results.charts.scoreChart.maxX]}
                                        label={{ value: results.charts.scoreChart.labels.x, dy: 20, position: "center", style: { fontWeight: "bold", fill: "#000" } }}
                                      />
                                      <YAxis
                                        type="number"
                                        dataKey="y"
                                        name={results.charts.scoreChart.labels.y}
                                        domain={[results.charts.scoreChart.minY, results.charts.scoreChart.maxY]}
                                        label={{
                                          value: results.charts.scoreChart.labels.y,
                                          angle: -90,
                                          dx: results.charts.scoreChart.maxLenY * -5 - 10,
                                          style: { fontWeight: "bold", fill: "#000" }
                                        }} />
                                      <Tooltip
                                        cursor={{ strokeDasharray: "3 3" }} content={<CustomScatterTooltip />}
                                      />
                                      <Scatter data={results.charts.scoreChart.data}
                                        shape="cross"
                                        fill="black"
                                      />
                                    </ScatterChart>
                                  </ResponsiveContainer>
                                </>
                              )}

                              {results.charts.relSubChart && (
                                <>
                                  <div className="flex items-center justify-center space-x-2 mt-6">
                                    <h1 className="text-lg font-bold">{results.charts.relSubChart.scorable ? "Relational VS Substantive" : "Relational Scores"}</h1>
                                    <Button
                                      variant="link"
                                      onClick={() => downloadChart(results.charts.relSubChart.id)}
                                      className="p-0"
                                    >
                                      <Download className="h-12 w-12 text-gray-800 font-bold" /> {/* Adjust icon size and color */}
                                    </Button>
                                  </div>
                                  <ResponsiveContainer width="100%" height={400}>
                                    {results.charts.relSubChart.scorable ? (
                                      <ScatterChart id={results.charts.relSubChart.id} margin={{ top: 20, right: 30, left: 30, bottom: 20 }} >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                          type="number"
                                          dataKey="x"
                                          name={results.charts.relSubChart.labels.x}
                                          domain={[results.charts.relSubChart.ticks.x[0], results.charts.relSubChart.ticks.x[results.charts.relSubChart.ticks.x.length - 1]]}
                                          ticks={results.charts.relSubChart.ticks.x}
                                          axisLine={false}
                                          label={{ value: results.charts.relSubChart.labels.x, dy: 20, position: "center", style: { fontWeight: "bold", fill: "#000" } }}
                                        />
                                        <YAxis
                                          type="number"
                                          dataKey="y"
                                          name={results.charts.relSubChart.labels.y}
                                          domain={[results.charts.relSubChart.ticks.y[0], results.charts.relSubChart.ticks.y[results.charts.relSubChart.ticks.y.length - 1]]}
                                          ticks={results.charts.relSubChart.ticks.y}
                                          axisLine={false}
                                          label={{
                                            value: results.charts.relSubChart.labels.y,
                                            angle: -90,
                                            dx: results.charts.relSubChart.maxLenY * -5 - 10,
                                            style: { fontWeight: "bold", fill: "#000" }
                                          }} />
                                        <ReferenceLine x={0} stroke="black" strokeWidth={1} />
                                        <ReferenceLine y={0} stroke="black" strokeWidth={1} />
                                        <Tooltip
                                          cursor={{ strokeDasharray: "3 3" }} content={<CustomScatterTooltip />}
                                        />
                                        {results?.charts?.relSubChart?.data && (
                                          <Scatter data={results.charts.relSubChart.data}
                                            shape="dot"
                                            fill="red"
                                          />
                                        )}
                                      </ScatterChart>
                                    ) : (
                                      <BarChart id={results.charts.relSubChart.id} data={results.charts.relSubChart.data.ranges} margin={{ top: 20, right: 30, left: 30, bottom: 20 }} >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                          dataKey="x"
                                          name={results.charts.relSubChart.isNumeric ? "Ranges" : "Choices"}
                                          label={{ value: (results.charts.relSubChart.isNumeric ? "Ranges" : "Choices"), dy: 20, position: "center", style: { fontWeight: "bold", fill: "black" } }}
                                        />
                                        <YAxis
                                          dataKey="y"
                                          name="Count"
                                          label={{ value: "Count", dy: 20, angle: -90, dx: -20, style: { fontWeight: "bold", fill: "black" } }}
                                        />
                                        <Tooltip cursor={{ fill: "lightgray" }} content={({ active, payload }) => {
                                          if (!active || !payload || !payload[0]?.payload) return null;
                                          const sRange = payload[0].payload.x;
                                          const sCount = payload[0].payload.y;
                                          return (
                                            <div className="bg-white p-2 border-gray-300 rounded shadow">
                                              <p className="text-sm text-gray-700 font-bold">{results.charts.relSubChart.isNumeric ? "Range" : "Choice"}: {sRange}</p>
                                              <p className="text-sm text-gray-700 font-bold">Count: {sCount}</p>
                                            </div>
                                          )
                                        }} />
                                        <Bar dataKey="y" fill="darkgray" stroke="gray" strokeWidth={2} />
                                      </BarChart>
                                    )}
                                  </ResponsiveContainer>
                                </>
                              )}
                              {results.charts.distCharts.map((distChart, index) => {
                                return (
                                  <div key={index} className="mt-6">
                                    <div className="flex items-center justify-center space-x-2">
                                      <h1 className="text-lg font-bold">{distChart.name}</h1>
                                      <Button
                                        variant="link"
                                        onClick={() => downloadChart(distChart.id)}
                                        className="p-0"
                                      >
                                        <Download className="h-12 w-12 text-gray-800 font-bold" /> {/* Adjust icon size and color */}
                                      </Button>
                                    </div>
                                    {distChart.isNumeric && (
                                      <h2 className="text-center text-md font-semibold">
                                        {[
                                          distChart.mean && `Mean = ${distChart.mean}`,
                                          distChart.std && `Std. Dev. = ${distChart.std}`,
                                          distChart.min && `Min = ${distChart.min}`,
                                          distChart.median && `Median = ${distChart.median}`,
                                          distChart.max && `Max = ${distChart.max}`,
                                        ]
                                          .filter(Boolean)
                                          .join(' | ')}
                                      </h2>
                                    )}
                                    <ResponsiveContainer width="100%" height={400}>
                                      <BarChart id={distChart.id} data={distChart.ranges} margin={{ top: 20, right: 30, left: 30, bottom: 20 }} >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                          dataKey="x"
                                          name={distChart.isNumeric ? "Ranges" : "Choices"}
                                          label={{ value: (distChart.isNumeric ? "Ranges" : "Choices"), dy: 20, position: "center", style: { fontWeight: "bold", fill: "black" } }}
                                        />
                                        <YAxis
                                          dataKey="y"
                                          name="Count"
                                          label={{ value: "Count", dy: 20, angle: -90, dx: -20, style: { fontWeight: "bold", fill: "black" } }}
                                        />
                                        <Tooltip cursor={{ fill: "lightgray" }} content={({ active, payload }) => {
                                          if (!active || !payload || !payload[0]?.payload) return null;
                                          const sRange = payload[0].payload.x;
                                          const sCount = payload[0].payload.y;
                                          return (
                                            <div className="bg-white p-2 border-gray-300 rounded shadow">
                                              <p className="text-sm text-gray-700 font-bold">{distChart.isNumeric ? "Range" : "Choice"}: {sRange}</p>
                                              <p className="text-sm text-gray-700 font-bold">Count: {sCount}</p>
                                            </div>
                                          )
                                        }} />
                                        <Bar dataKey="y" fill="darkgray" stroke="gray" strokeWidth={2} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                )
                              })}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}

                    {results?.teams.length > 0 && (
                      <Accordion type="single" collapsible>
                        <AccordionItem value="leaderboard">
                          <AccordionTrigger className="text-lg font-semibold">Leaderboard</AccordionTrigger>
                          <AccordionContent>
                            {results.vsAI ? (
                              <ResultsTable results={results.teams} cases={cases} dealParams={cases[rounds[round]?.case?.id]?.params} onUpdate={updateResult} onDelete={deleteResult} sviForm={sviForm} aiRound={results.vsAI} />
                            ) : (
                              <>
                                <h1 className="text-center text-lg font-bold mb-2">{results.aName}</h1>
                                <ResultsTable results={results.teams.filter(team => team.side === "a")} cases={cases} dealParams={cases[rounds[round]?.case?.id]?.params} onUpdate={updateResult} onDelete={deleteResult} sviForm={sviForm} aiRound={results.vsAI} />

                                <h1 className="text-center text-lg font-bold mb-2 mt-6">{results.bName}</h1>
                                <ResultsTable results={results.teams.filter(team => team.side === "b")} cases={cases} dealParams={cases[rounds[round]?.case?.id]?.params} onUpdate={updateResult} onDelete={deleteResult} sviForm={sviForm} aiRound={results.vsAI} />
                              </>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    )}
                  </Card>
                )
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
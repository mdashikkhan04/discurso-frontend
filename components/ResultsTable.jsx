"use client";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button";
import { Edit, X, Clock, UserX, CircleAlert } from 'lucide-react';
import ResultEdit from "@/components/ResultEdit";
import HoverableIndicator from "@/components/HoverableIndicator";
import { useState, useMemo } from "react";
import { getNiceNum } from "@/lib/util"

// kinda ugly and stupid but will do for now
const SVI_FIELDS = [
  'satisfaction', 'balance', 'forfeited', 'legitimacy',
  'loseFace', 'competence', 'principles', 'selfImage',
  'listened', 'fairness', 'ease', 'considered',
  'impression', 'relationshipSatisfaction', 'trust', 'futureRelationship'
];
function hasCompleteSvi(survey) {
  if (!survey) return false;
  return SVI_FIELDS.every(field => {
    const val = survey[field];
    return val !== undefined && val !== null && val !== '' && val?.toString().trim() !== '';
  });
}

export default function ResultsTable({ results, cases, dealParams, onUpdate, onDelete, sviForm, aiRound }) {
  const [editingResult, setEditingResult] = useState(null);
  const [sorting, setSorting] = useState([]);

  const columns = useMemo(() => {
    const showSubScore = results?.some(result => cases[result.caseId]?.scorable !== false);

    return [
      {
        accessorKey: "rank",
        header: ({ column }) => (
          <div className="flex items-center">
            <span>Rank</span>
            <button
              className={`ml-1 ${column.getIsSorted() ? 'text-blue-700' : 'text-gray-400'}`}
              onClick={() => column.toggleSorting()}
            >{column.getIsSorted() === 'desc' ? '▼' : '▲'}</button>
          </div>
        ),
        cell: ({ row }) => <div className={`font-semibold ${row.original.disqualified ? "text-red-700" : ""}`}>{row.getValue("rank")}</div>,
      },
      {
        accessorKey: "team",
        header: ({ column }) => (
          <div className="flex items-center">
            <span>Team</span>
            <button
              className={`ml-1 ${column.getIsSorted() ? 'text-blue-700' : 'text-gray-400'}`}
              onClick={() => column.toggleSorting()}
            >{column.getIsSorted() === 'desc' ? '▼' : '▲'}</button>
          </div>
        ),
        cell: ({ row }) => <div className={`font-semibold ${row.original.disqualified ? "text-red-700" : ""}`}>{row.getValue("team")}</div>,
      },
      ...(showSubScore ? [{
        accessorFn: (row) => row.agreeStats?.subScore,
        id: "subScore",
        header: ({ column }) => (
          <div className="flex items-center">
            <span>Substantive Z-Score</span>
            <button
              className={`ml-1 ${column.getIsSorted() ? 'text-blue-700' : 'text-gray-400'}`}
              onClick={() => column.toggleSorting()}
            >{column.getIsSorted() === 'desc' ? '▼' : '▲'}</button>
          </div>
        ),
        cell: ({ row }) => <div className={`${row.original.disqualified ? "text-red-700" : ""}`}>{row.original.disqualified ? "" : getNiceNum(row.getValue("subScore"), 2)}</div>,
      }] : []),
      {
        accessorFn: (row) => row.surveyStats?.relScore,
        id: "relScore",
        header: ({ column }) => (
          <div className="flex items-center">
            <span>Relational Z-Score</span>
            <button
              className={`ml-1 ${column.getIsSorted() ? 'text-blue-700' : 'text-gray-400'}`}
              onClick={() => column.toggleSorting()}
            >{column.getIsSorted() === 'desc' ? '▼' : '▲'}</button>
          </div>
        ),
        cell: ({ row }) => {
          if (row.original.pending) return <HoverableIndicator children={<Clock />} text="No agreement submitted yet" />;
          if (row.original.noEnemySvi) return <HoverableIndicator children={<UserX />} text="Missing opponent's SVI" />;

          const relScore = row.getValue("relScore");
          const hasSvi = row.original.hasSvi;
          const ownSurvey = row.original.survey;
          const isSviIncomplete = hasSvi && ownSurvey && !hasCompleteSvi(ownSurvey);

          if (relScore === null || relScore === undefined) {
            return <div className={`${row.original.disqualified ? "text-red-700" : ""}`}>
              {row.original.disqualified ? "" : <HoverableIndicator children={<CircleAlert className="text-red-500" strokeWidth={3} />} text="No SVI submitted" />}
            </div>;
          }

          return (
            <div className={`flex items-center gap-1 ${row.original.disqualified ? "text-red-700" : isSviIncomplete ? "text-amber-600" : ""}`}>
              {isSviIncomplete ? (
                <HoverableIndicator
                  children={
                    <>
                      {getNiceNum(relScore, 2)}
                      <span className="text-md font-semibold">*</span>
                    </>
                  }
                  text="SVI incomplete"
                />
              ) : (
                getNiceNum(relScore, 2)
              )}
            </div>
          );
        },
      },
      ...(showSubScore ? [{
        accessorFn: (row) => row.surveyStats?.totalZScore,
        id: "totalScore",
        header: ({ column }) => (
          <div className="flex items-center">
            <span>Total Z-Score</span>
            <button
              className={`ml-1 ${column.getIsSorted() ? 'text-blue-700' : 'text-gray-400'}`}
              onClick={() => column.toggleSorting()}
            >{column.getIsSorted() === 'desc' ? '▼' : '▲'}</button>
          </div>
        ),
        cell: ({ row }) => <div>{row.original.disqualified ? <HoverableIndicator children={<X className="text-red-500" strokeWidth={4} />} text="No deal" /> : getNiceNum(row.getValue("totalScore"), 2)}</div>,
      }] : []),
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => setEditingResult({ ...row.original, index: row.index })}
              size="icon"
              title="Edit result"
            >
              <Edit className="h-8 w-8" />
            </Button>
          );
        },
      },
    ]
  }, [results, cases]);

  const table = useReactTable({
    data: results,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (!results?.length) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-md border-2 border-gray-400 overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-2 border-gray-400">
                {/* <TableRow key={headerGroup.id}> */}
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold text-gray-700">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-t border-gray-400"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editingResult && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-xl font-semibold">Edit results for Team {editingResult.team} in round {editingResult.round}</h2>
              <Button variant="ghost" size="icon" onClick={() => setEditingResult(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4">
              <ResultEdit
                orgResult={editingResult}
                cases={cases}
                dealParams={dealParams}
                onUpdate={(updatedResult) => {
                  onUpdate(updatedResult);
                  setEditingResult(null);
                }}
                onDelete={(resultId) => {
                  onDelete(resultId);
                  setEditingResult(null);
                }}
                sviForm={sviForm}
                aiRound={aiRound}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

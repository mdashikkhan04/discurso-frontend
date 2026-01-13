'use client';

import '@/public/editor.css'
import '@/public/case.css'
import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'

import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'

import Document from '@tiptap/extension-document'
import Gapcursor from '@tiptap/extension-gapcursor'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'

import React from 'react'

import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    Eraser,
    Trash2,
    Type,           // For Paragraph
    List,           // For Bullet List
    Quote,          // For Blockquote
    Minus,          // For Horizontal Rule
    CornerDownLeft, // For Hard Break
    RotateCcw,      // For Undo
    RotateCw,       // For Redo
    Eye,            // For Preview
    Heading,
    Table as TableIcon,
    Columns2,
    BetweenVerticalEnd,
    Rows2,
    BetweenHorizontalEnd,
    Grid2x2X,
    TableCellsMerge,
    TableCellsSplit,
} from "lucide-react";

export default function RichTextEditor({ content = "", onChange, onPreview }) {
    const editor = useEditor({
        content: content,
        editorProps: { attributes: { dir: "auto", lang: "auto" } },
        extensions: [
            TextStyle.configure({ types: [ListItem.name] }),
            StarterKit.configure({
                bulletList: {
                    keepMarks: true,
                    keepAttributes: false,
                },
                heading: {
                    levels: [2],
                },
            }),
            Table.configure({
                resizable: false,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Document,
            Gapcursor,
            Paragraph,
            Text,
        ],
        onUpdate({ editor }) {
            onChange(editor.getHTML());
        },
    });

    const MenuButton = ({ handleClick, label, tooltip, disabled, active }) => {
        return (
            <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClick}
                title={tooltip}
                disabled={disabled}
                className={`${active ? 'is-active' : ''} text-sm text-gray-700 m-1 px-1 py-1 border border-gray-300 rounded-md bg-gray-50`}
            >
                {label}
            </button>
        );
    };

    const MenuBar = ({ editor }) => {
        if (!editor) {
            return null;
        }

        return (
            <div className="control-group">
                <div className="button-group">
                    {/* Bold */}
                    <MenuButton
                        handleClick={() => editor.chain().focus().toggleBold().run()}
                        editor={editor}
                        label={<Bold size={16} strokeWidth={editor.isActive("bold") ? 3 : 1} />}
                        tooltip="Bold"
                        disabled={!editor.can().chain().focus().toggleBold().run()}
                        active={editor.isActive("bold")}
                    />

                    {/* Italic */}
                    <MenuButton
                        handleClick={() => editor.chain().focus().toggleItalic().run()}
                        editor={editor}
                        label={<Italic size={16} strokeWidth={editor.isActive("italic") ? 3 : 1} />}
                        tooltip="Italic"
                        disabled={!editor.can().chain().focus().toggleItalic().run()}
                        active={editor.isActive("italic")}
                    />
                    {/* Strike */}
                    <MenuButton
                        handleClick={() => editor.chain().focus().toggleStrike().run()}
                        editor={editor}
                        label={<Strikethrough size={16} strokeWidth={editor.isActive("strike") ? 3 : 1} />}
                        tooltip="Strike"
                        disabled={!editor.can().chain().focus().toggleStrike().run()}
                        active={editor.isActive("strike")}
                    />
                    {/* Inline Code */}
                    <MenuButton
                        handleClick={() => editor.chain().focus().toggleCode().run()}
                        editor={editor}
                        label={<Code size={16} strokeWidth={editor.isActive("code") ? 3 : 1} />}
                        tooltip="Code"
                        disabled={!editor.can().chain().focus().toggleCode().run()}
                        active={editor.isActive("code")}
                    />
                    {/* Paragraph */}
                    <MenuButton
                        handleClick={() => editor.chain().focus().setParagraph().run()}
                        editor={editor}
                        label={<Type size={16} strokeWidth={editor.isActive("paragraph") ? 3 : 1} />}
                        tooltip="Paragraph"
                        disabled={false}
                        active={editor.isActive("paragraph")}
                    />
                    {/* Headings */}
                    <MenuButton
                        handleClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        editor={editor}
                        label={<Heading size={16} strokeWidth={editor.isActive("heading") ? 3 : 1} />}
                        tooltip="Heading"
                        disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run()}
                        active={editor.isActive("heading", { level: 2 })}
                    />
                    <span className="mx-1" />
                    {/* Bullet List */}
                    <MenuButton
                        handleClick={() => editor.chain().focus().toggleBulletList().run()}
                        editor={editor}
                        label={<List size={16} strokeWidth={editor.isActive("bulletList") ? 3 : 1} />}
                        tooltip="Bullet List"
                        disabled={!editor.can().chain().focus().toggleBulletList().run()}
                        active={editor.isActive("bulletList")}
                    />
                    {/* Blockquote */}
                    <MenuButton
                        handleClick={() => editor.chain().focus().toggleBlockquote().run()}
                        editor={editor}
                        label={<Quote size={16} strokeWidth={editor.isActive("blockquote") ? 3 : 1} />}
                        tooltip="Blockquote"
                        disabled={!editor.can().chain().focus().toggleBlockquote().run()}
                        active={editor.isActive("blockquote")}
                    />
                    {/* Horizontal Rule */}
                    <MenuButton
                        handleClick={() => editor.chain().focus().setHorizontalRule().run()}
                        editor={editor}
                        label={<Minus size={16} strokeWidth={1} />}
                        tooltip="Horizontal Rule"
                        disabled={false}
                        active={false}
                    />
                    {/* Hard Break */}
                    <MenuButton
                        handleClick={() => editor.chain().focus().setHardBreak().run()}
                        editor={editor}
                        label={<CornerDownLeft size={16} strokeWidth={1} />}
                        tooltip="Hard Break"
                        disabled={false}
                        active={false}
                    />
                    {/* Clear Marks */}
                    <MenuButton
                        handleClick={() => editor.chain().focus().unsetAllMarks().run()}
                        editor={editor}
                        label={<Eraser size={16} strokeWidth={1} />}
                        tooltip="Remove styling"
                        disabled={false}
                        active={false}
                    />
                    {/* Clear Nodes */}
                    <MenuButton
                        handleClick={() => editor.chain().focus().clearNodes().run()}
                        editor={editor}
                        label={<Trash2 size={16} strokeWidth={1} />}
                        tooltip="Delete elements"
                        disabled={false}
                        active={false}
                    />
                    <span className="mx-2" />
                    {/* Table */}
                    <MenuButton
                        handleClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                        editor={editor}
                        label={<TableIcon size={16} strokeWidth={1} />}
                        tooltip="Insert table"
                        disabled={!editor.can().chain().focus().insertTable().run()}
                        active={false}
                    />
                    <MenuButton
                        handleClick={() => editor.chain().focus().addColumnAfter().run()}
                        editor={editor}
                        label={<Columns2 size={16} strokeWidth={1} />}
                        tooltip="Add column"
                        disabled={!editor.can().chain().focus().addColumnAfter().run()}
                        active={false}
                    />
                    <MenuButton
                        handleClick={() => editor.chain().focus().deleteColumn().run()}
                        editor={editor}
                        label={<BetweenVerticalEnd size={16} strokeWidth={1} />}
                        tooltip="Delete column"
                        disabled={!editor.can().chain().focus().deleteColumn().run()}
                        active={false}
                    />
                    <MenuButton
                        handleClick={() => editor.chain().focus().addRowAfter().run()}
                        editor={editor}
                        label={<Rows2 size={16} strokeWidth={1} />}
                        tooltip="Add row"
                        disabled={!editor.can().chain().focus().addRowAfter().run()}
                        active={false}
                    />
                    <MenuButton
                        handleClick={() => editor.chain().focus().deleteRow().run()}
                        editor={editor}
                        label={<BetweenHorizontalEnd size={16} strokeWidth={1} />}
                        tooltip="Delete row"
                        disabled={!editor.can().chain().focus().deleteRow().run()}
                        active={false}
                    />
                    <MenuButton
                        handleClick={() => editor.chain().focus().deleteTable().run()}
                        editor={editor}
                        label={<Grid2x2X size={16} strokeWidth={1} />}
                        tooltip="Delete table"
                        disabled={!editor.can().chain().focus().deleteTable().run()}
                        active={false}
                    />
                    <MenuButton
                        handleClick={() => editor.chain().focus().mergeCells().run()}
                        editor={editor}
                        label={<TableCellsMerge size={16} strokeWidth={1} />}
                        tooltip="Merge cells"
                        disabled={!editor.can().chain().focus().mergeCells().run()}
                        active={false}
                    />
                    <MenuButton
                        handleClick={() => editor.chain().focus().splitCell().run()}
                        editor={editor}
                        label={<TableCellsSplit size={16} strokeWidth={1} />}
                        tooltip="Split cells"
                        disabled={!editor.can().chain().focus().splitCell().run()}
                        active={false}
                    />
                    <span className="mx-2" />
                    {/* Undo */}
                    <MenuButton
                        handleClick={() => editor.chain().focus().undo().run()}
                        editor={editor}
                        label={<RotateCcw size={16} strokeWidth={2} />}
                        tooltip="Undo"
                        disabled={!editor.can().chain().focus().undo().run()}
                        active={false}
                    />
                    {/* Redo */}
                    <MenuButton
                        handleClick={() => editor.chain().focus().redo().run()}
                        editor={editor}
                        label={<RotateCw size={16} strokeWidth={2} />}
                        tooltip="Redo"
                        disabled={!editor.can().chain().focus().redo().run()}
                        active={false}
                    />
                    <span className="mx-2" />
                    {/* Preview */}
                    <MenuButton
                        handleClick={(e) => {
                            if (e) e.preventDefault();
                            if (!editor) return;
                            if (onPreview) {
                                onPreview(editor.getHTML());
                            }
                        }}
                        editor={editor}
                        label={<Eye size={16} strokeWidth={1} />}
                        tooltip="Preview"
                        disabled={false}
                        active={false}
                    />
                </div>
            </div>
        );
    };

    useEffect(() => {
        if (!editor) {
            return;
        }

        const normalize = (value) => {
            if (!value) return "";
            const trimmed = value.trim();
            if (trimmed === "<p></p>" || trimmed === "<p><br></p>") return "";
            return trimmed;
        };

        const incoming = normalize(content);
        const current = normalize(editor.getHTML());

        if (incoming !== current) {
            editor.commands.setContent(content || "", false);
        }
    }, [editor, content]);

    useEffect(() => {
        return () => {
            editor?.destroy(); // Properly clean up the editor instance
        };
    }, [editor]);

    return (
        <div className="editor">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} className="px-2 py-1" dir="auto" />
        </div>
    );
}
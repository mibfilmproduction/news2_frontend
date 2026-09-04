"use client";

import React, { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { FontFamily } from "@tiptap/extension-font-family";
import { TextStyle } from "@tiptap/extension-text-style";
import { Typography } from "@tiptap/extension-typography";
import { common, createLowlight } from "lowlight";

import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  Table as TableIcon,
  CheckSquare,
  Highlighter,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Minus,
  Superscript,
  Subscript,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { toast } from "react-hot-toast";

const lowlight = createLowlight(common);

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

const MENU_ITEMS: any[] = [
  {
    type: "heading",
    items: [
      { label: "Heading 1", level: 1, icon: Heading1 },
      { label: "Heading 2", level: 2, icon: Heading2 },
      { label: "Heading 3", level: 3, icon: Heading3 },
      { label: "Paragraph", level: 0, icon: Type },
    ],
  },
  {
    type: "formatting",
    items: [
      { label: "Bold", command: "toggleBold", icon: Bold, shortcut: "Ctrl+B" },
      { label: "Italic", command: "toggleItalic", icon: Italic, shortcut: "Ctrl+I" },
      { label: "Underline", command: "toggleUnderline", icon: UnderlineIcon, shortcut: "Ctrl+U" },
      { label: "Strikethrough", command: "toggleStrike", icon: Strikethrough },
      { label: "Highlight", command: "toggleHighlight", icon: Highlighter },
      { label: "Code", command: "toggleCode", icon: Code },
      { label: "Superscript", command: "toggleSuperscript", icon: Superscript },
      { label: "Subscript", command: "toggleSubscript", icon: Subscript },
    ],
  },
  {
    type: "lists",
    items: [
      { label: "Bullet List", command: "toggleBulletList", icon: List },
      { label: "Ordered List", command: "toggleOrderedList", icon: ListOrdered },
      { label: "Task List", command: "toggleTaskList", icon: CheckSquare },
    ],
  },
  {
    type: "blocks",
    items: [
      { label: "Quote", command: "toggleBlockquote", icon: Quote },
      { label: "Code Block", command: "toggleCodeBlock", icon: Code },
      { label: "Horizontal Rule", command: "setHorizontalRule", icon: Minus },
      { label: "Table", command: "insertTable", icon: TableIcon },
    ],
  },
  {
    type: "media",
    items: [
      { label: "Image", command: "insertImage", icon: ImageIcon },
      { label: "Link", command: "insertLink", icon: LinkIcon },
    ],
  },
  {
    type: "alignment",
    items: [
      { label: "Align Left", command: "setTextAlignLeft", icon: AlignLeft },
      { label: "Align Center", command: "setTextAlignCenter", icon: AlignCenter },
      { label: "Align Right", command: "setTextAlignRight", icon: AlignRight },
      { label: "Justify", command: "setTextAlignJustify", icon: AlignJustify },
    ],
  },
];

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  editable = true,
  className,
}: RichTextEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        codeBlock: false,
        link: false,
        underline: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "rounded-lg max-w-full h-auto",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline hover:no-underline",
          rel: "noopener noreferrer",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Color,
      FontFamily,
      TextStyle,
      Typography,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-lg max-w-none focus:outline-none min-h-[400px] p-4",
      },
    },
  });

  // Tiptap only consumes `content` during initialization. Keep it in sync
  // when an existing article is loaded asynchronously or the form is reset.
  useEffect(() => {
    if (editor && editor.getHTML() !== content) {
      editor.commands.setContent(content || '', { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const handleImageInsert = () => {
    imageInputRef.current?.click();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be smaller than 10MB");
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "mibnews/articles");
      formData.append("alt", file.name);
      const response = await api.upload<{ url: string }>("/media/upload", formData);
      const url = response.data?.url;
      if (!response.success || !url) throw new Error(response.message || "Image upload failed");
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      toast.success("Image added to article");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleLinkInsert = () => {
    const url = window.prompt("Enter link URL:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  const handleTableInsert = () => {
    const rows = parseInt(window.prompt("Number of rows:", "3") || "3", 10);
    const cols = parseInt(window.prompt("Number of columns:", "3") || "3", 10);
    if (rows && cols) {
      editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    }
  };

  const renderMenuButton = (item: any, isActive: boolean = false) => {
    const Icon = item.icon;
    const handleClick = () => {
      if (item.command === "insertImage") {
        handleImageInsert();
      } else if (item.command === "insertLink") {
        handleLinkInsert();
      } else if (item.command === "insertTable") {
        handleTableInsert();
      } else {
        const chain = editor.chain().focus() as any;
        if (typeof chain[item.command] === 'function') chain[item.command]().run();
      }
    };

    return (
      <Button
        key={`${item.command}-${item.label}`}
        type="button"
        variant={isActive ? "secondary" : "outline"}
        size="icon"
        className="h-8 w-8"
        onClick={handleClick}
        disabled={false}
        title={`${item.label}${item.shortcut ? ` (${item.shortcut})` : ""}`}
      >
        <Icon className="h-4 w-4" />
      </Button>
    );
  };

  const renderHeadingDropdown = () => {
    const { items } = MENU_ITEMS[0];
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-3">
            <Type className="h-4 w-4 mr-1" />
            {editor.isActive("heading", { level: 1 }) ? "Heading 1" :
              editor.isActive("heading", { level: 2 }) ? "Heading 2" :
              editor.isActive("heading", { level: 3 }) ? "Heading 3" : "Paragraph"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {items.map((item) => (
            <DropdownMenuItem
              key={item.level}
              onSelect={() => {
                if (item.level === 0) {
                  editor.chain().focus().setParagraph().run();
                } else {
                  editor.chain().focus().toggleHeading({ level: item.level }).run();
                }
              }}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const renderColorPicker = (type: "color" | "background") => {
    const colors = [
      "#000000", "#ffffff", "#ef4444", "#f97316", "#f59e0b", "#22c55e",
      "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
    ];

    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            style={{
              borderBottom: type === "color" ? "3px solid currentColor" : undefined,
              backgroundColor: type === "background" ? editor.getAttributes("textStyle").backgroundColor : undefined,
            }}
          >
            {type === "color" ? (
              <Type className="h-4 w-4" style={{ color: editor.getAttributes("textStyle").color || "inherit" }} />
            ) : (
              <Highlighter className="h-4 w-4" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-2" sideOffset={5}>
          <div className="grid grid-cols-6 gap-1">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                className="h-6 w-6 rounded border"
                style={{ backgroundColor: color }}
                onClick={() => {
                  if (type === "color") {
                    editor.chain().focus().setColor(color).run();
                  } else {
                    (editor.chain().focus() as any).setBackgroundColor?.(color).run();
                  }
                }}
                title={color}
              />
            ))}
            <button
              type="button"
              className="h-6 w-6 rounded border flex items-center justify-center"
              onClick={() => {
                if (type === "color") {
                  editor.chain().focus().unsetColor().run();
                } else {
                  (editor.chain().focus() as any).unsetBackgroundColor?.().run();
                }
              }}
              title="Clear"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </PopoverContent>
      </Popover>
    );
  };

  const renderFontSizePicker = () => {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-3">
            <Type className="h-4 w-4 mr-1" />
            {editor.getAttributes("textStyle").fontSize || "Size"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-2" sideOffset={5}>
          <Slider
            min={12}
            max={48}
            step={2}
            value={[Number.parseInt(editor.getAttributes("textStyle").fontSize) || 16]}
            onValueChange={(value) => {
              (editor.chain().focus() as any).setFontSize?.(`${value[0]}px`).run();
            }}
            className="w-48"
          />
        </PopoverContent>
      </Popover>
    );
  };

  const renderFontFamilyPicker = () => {
    const fonts = [
      "system-ui",
      "Georgia",
      "Times New Roman",
      "Arial",
      "Helvetica",
      "Verdana",
      "Courier New",
      "Monospace",
    ];

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 px-3">
            <Type className="h-4 w-4 mr-1" />
            {editor.getAttributes("textStyle").fontFamily || "Font"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {fonts.map((font) => (
            <DropdownMenuItem
              key={font}
              onSelect={() => editor.chain().focus().setFontFamily(font).run()}
              className="font-sans"
              style={{ fontFamily: font }}
            >
              {font}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <div className={cn("border rounded-lg bg-white", className)}>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        onChange={handleImageUpload}
        aria-label="Upload image to article"
      />
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/20 p-2">
        {/* Heading */}
        {renderHeadingDropdown()}

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Formatting */}
        {MENU_ITEMS[1].items.map((item) => renderMenuButton(item, editor.isActive(item.command)))}

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists */}
        {MENU_ITEMS[2].items.map((item) => renderMenuButton(item, editor.isActive(item.command)))}

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Blocks */}
        {MENU_ITEMS[3].items.map((item) => renderMenuButton(item))}

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Media */}
        {MENU_ITEMS[4].items.map((item) =>
          item.command === "insertImage"
            ? renderMenuButton({ ...item, label: isUploadingImage ? "Uploading image..." : item.label })
            : renderMenuButton(item)
        )}

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Alignment */}
        {MENU_ITEMS[5].items.map((item) => renderMenuButton(item, editor.isActive(item.command)))}

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Colors */}
        {renderColorPicker("color")}
        {renderColorPicker("background")}

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Typography */}
        {renderFontFamilyPicker()}
        {renderFontSizePicker()}

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* History */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor;

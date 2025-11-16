import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect } from "react";
import Placeholder from '@tiptap/extension-placeholder';
import '../styles/tiptapCss.css';
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";
import TextStyle from "@tiptap/extension-text-style";
import {
    FaBold,
    FaItalic,
    FaUnderline,
    FaStrikethrough,
    FaHeading,
    FaListUl,
    FaListOl,
    FaQuoteLeft,
    FaLink,
    FaAlignLeft,
    FaAlignCenter,
    FaAlignRight,
    FaAlignJustify,
} from "react-icons/fa";
import { FaLinkSlash } from "react-icons/fa6";

const MenuBar = ({ editor }) => {
    if (!editor) {
        return null;
    }

    const addLink = () => {
        const url = window.prompt("Enter the URL");
        if (url) {
            editor.chain().focus().setLink({ href: url }).run();
        }
    };

    const removeLink = () => {
        editor.chain().focus().unsetLink().run();
    };

    return (
        <div className="menuBar">
            <div>
                {/* Font Style */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive("bold") ? "is_active" : ""}
                >
                    <FaBold />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive("italic") ? "is_active" : ""}
                >
                    <FaItalic />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={editor.isActive("underline") ? "is_active" : ""}
                >
                    <FaUnderline />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={editor.isActive("strike") ? "is_active" : ""}
                >
                    <FaStrikethrough />
                </button>

                {/* Headings */}
                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    className={editor.isActive("heading", { level: 2 }) ? "is_active" : ""}
                >
                    <FaHeading />
                </button>
                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                    className={editor.isActive("heading", { level: 3 }) ? "is_active" : ""}
                >
                    <FaHeading className="heading3" />
                </button>

                <button
                    type="button"
                    onClick={() => editor.chain().focus().setColor("#FF0000").run()}
                >
                    Red
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setColor("#00FF00").run()}
                >
                    Green
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setHighlight({ color: "#FFFF00" }).run()}
                >
                    Highlight
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setFontFamily("Arial").run()}
                >
                    Arial
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().setFontFamily("Courier New").run()}
                >
                    Courier
                </button>


                {/* Lists */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive("bulletList") ? "is_active" : ""}
                >
                    <FaListUl />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive("orderedList") ? "is_active" : ""}
                >
                    <FaListOl />
                </button>

                {/* Blockquote */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive("blockquote") ? "is_active" : ""}
                >
                    <FaQuoteLeft />
                </button>

                {/* Alignment */}
                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().setTextAlign("left").run()
                    }
                    className={editor.isActive({ textAlign: "left" }) ? "is_active" : ""}
                >
                    <FaAlignLeft />
                </button>
                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().setTextAlign("center").run()
                    }
                    className={editor.isActive({ textAlign: "center" }) ? "is_active" : ""}
                >
                    <FaAlignCenter />
                </button>
                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().setTextAlign("right").run()
                    }
                    className={editor.isActive({ textAlign: "right" }) ? "is_active" : ""}
                >
                    <FaAlignRight />
                </button>
                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().setTextAlign("justify").run()
                    }
                    className={editor.isActive({ textAlign: "justify" }) ? "is_active" : ""}
                >
                    <FaAlignJustify />
                </button>

                {/* Links */}
                <button type="button" onClick={addLink}>
                    <FaLink />
                </button>
                <button type="button" onClick={removeLink}>
                    <FaLinkSlash /> {/* Replace with an unlink icon if needed */}
                </button>

                {/* Clean Formatting */}
                <button
                    type="button"
                    onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                >
                    Clear
                </button>
            </div>
        </div>
    );
};

/* import {
    FaBold,
    FaHeading,
    FaItalic,
    FaListOl,
    FaListUl,
    FaQuoteLeft,
    FaStrikethrough,
    FaUnderline,
} from "react-icons/fa";

const MenuBar = ({ editor }) => {
    if (!editor) {
        return null;
    }

    return (
        <div className="menuBar">
            <div>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={editor.isActive("bold") ? "is_active" : ""}
                >
                    <FaBold />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={editor.isActive("italic") ? "is_active" : ""}
                >
                    <FaItalic />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={editor.isActive("underline") ? "is_active" : ""}
                >
                    <FaUnderline />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={editor.isActive("strike") ? "is_active" : ""}
                >
                    <FaStrikethrough />
                </button>
                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    className={
                        editor.isActive("heading", { level: 2 }) ? "is_active" : ""
                    }
                >
                    <FaHeading />
                </button>
                <button
                    type="button"
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                    className={
                        editor.isActive("heading", { level: 3 }) ? "is_active" : ""
                    }
                >
                    <FaHeading className="heading3" />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={editor.isActive("bulletList") ? "is_active" : ""}
                >
                    <FaListUl />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={editor.isActive("orderedList") ? "is_active" : ""}
                >
                    <FaListOl />
                </button>
                <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={editor.isActive("blockquote") ? "is_active" : ""}
                >
                    <FaQuoteLeft />
                </button>
            </div>
        </div>
    );
}; */

export const Tiptap = ({ initialContent, onContentChange }) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Placeholder.configure({
                placeholder: 'Type your content here...'
            }),
            TextAlign.configure({
                types: ["heading", "paragraph"],
            }),
            Link,
            TextStyle,
            Color.configure({
                types: ["textStyle"],
            }),
            Highlight,
            FontFamily.configure({
                types: ["textStyle"],
            }),
        ],
        content: initialContent,
        onUpdate: ({ editor }) => {
            const newContent = editor.getHTML();
            onContentChange(newContent);
        },
    });

    useEffect(() => {
        if (editor && initialContent) {
            const currentContent = editor.getHTML();
            if (currentContent !== initialContent) {
                editor.commands.setContent(initialContent);
            }
        }
    }, [editor, initialContent]);
    return (
        <div className="textEditor">
            <MenuBar editor={editor} />
            <EditorContent editor={editor} />
        </div>
    );
};
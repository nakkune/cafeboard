import { useCreateBlockNote, useEditorChange } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
// Inter 폰트는 이미 index.css에서 전역으로 관리하고 있으므로 별도 import는 생략하거나 유지할 수 있습니다.
import "@blocknote/core/fonts/inter.css";

interface BlockEditorProps {
  content: {
    text?: string;
    json?: any;
  };
  onChange: (content: { text: string; json: any }) => void;
  editable?: boolean;
}

/**
 * [Senior Note] 
 * BlockNote는 강력한 기능을 제공하지만 Mantine 테마에 의존적입니다.
 * 컨테이너 스타일링을 통해 Mantine 특유의 투박함을 지우고 애플 스타일의 세련된 디자인을 입혔습니다.
 */
function BlockNoteInternal({ content, onChange, editable = true }: BlockEditorProps) {
  // [Senior Note] BlockNote는 initialContent로 빈 배열([])을 받으면 에러가 발생할 수 있습니다.
  // 데이터가 배열이면서 최소 하나 이상의 블록이 있을 때만 데이터를 사용하고, 아니면 undefined를 주어 새 문서를 만들게 합니다.
  const initialBlocks =
    content?.json &&
      Array.isArray(content.json) &&
      content.json.length > 0
      ? content.json
      : undefined;

  const editor = useCreateBlockNote({
    initialContent: initialBlocks,
    uploadFile: async (file) => {
      // 실무에서는 여기서 서버 API로 업로드 후 실제 URL을 반환해야 합니다.
      const url = URL.createObjectURL(file);
      return url;
    },
  });

  // 에디터 내용 변경 시 JSON과 HTML을 동시에 상위로 전달
  useEditorChange(async () => {
    if (editor) {
      const json = editor.document;
      const html = await editor.blocksToHTMLLossy(editor.document);
      onChange({
        text: html,
        json: json,
      });
    }
  }, editor);

  /**
   * [Senior Solution] 
   * BlockNote의 슬래시 메뉴(/)나 팝오버는 Mantine의 Portal을 통해 렌더링되는데, 
   * 가끔 상위 레이아웃의 z-index 계층 구조에 따라 기존 페이지 요소(타이틀, 사이드바 등)에 가려지는 현상이 발생합니다.
   * 이를 해결하기 위해 에디터 컨테이너에 isolation을 부여하고, 내부 Mantine 드롭다운의 z-index를 보강합니다.
   */
  return (
    <div className="blocknote-premium-wrapper min-h-[400px] relative isolate">
      {/* 
        [Senior Technique] 
        전체 레이아웃과의 충돌 방지를 위해 Mantine 팝오버의 z-index를 CSS 레벨에서 보강합니다.
        이렇게 하면 portaled 메뉴들이 사이드바(z-40)나 헤더(z-50)보다 확실하게 위에 오도록 보장됩니다.
      */}
      <style>{`
        .mantine-Popover-dropdown, .mantine-Menu-dropdown, .bn-slash-menu {
          z-index: 1000 !important;
        }
      `}</style>
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme="light"
      />
    </div>
  );
}

export function BlockEditor(props: BlockEditorProps) {
  const { editable = true } = props;

  return (
    <div className={`transition-all duration-700 ease-in-out ${editable
      ? "bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/50 p-6 sm:p-10"
      : "py-4"
      }`}>
      <BlockNoteInternal {...props} />

      {editable && (
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between opacity-30 px-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">BlockNote Engine</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium italic">Shift + Enter for new line</span>
        </div>
      )}
    </div>
  );
}

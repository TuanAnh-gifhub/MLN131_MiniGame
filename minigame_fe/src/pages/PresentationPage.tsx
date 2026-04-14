import { useEffect, useState } from 'react';
import {
  BookOpen, Flag, Landmark, Users, Briefcase, Scale,
  AlertTriangle, CheckCircle2, ChevronDown,
  TrendingUp, Shield, Lightbulb, Globe, Unlock, HeartHandshake, Gift, Target
} from 'lucide-react';
import './PresentationPage.css';

type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

const quizData: QuizQuestion[] = [
  {
    id: 1,
    question: 'Tại sao trong thời kỳ quá độ lên CNXH, kinh tế tư nhân vẫn được phép tồn tại?',
    options: [
      'Vì Nhà nước không đủ nguồn lực để quản lý tất cả.',
      'Để tận dụng vốn, công nghệ và sức sản xuất nhằm phát triển kinh tế.',
      'Vì CNXH không có ý định xóa bỏ kinh tế tư nhân.',
      'Vì áp lực từ các tổ chức quốc tế.'
    ],
    correctAnswer: 1,
    explanation: 'Đây là giải pháp chiến lược để phát triển lực lượng sản xuất trong thời kỳ quá độ.'
  },
  {
    id: 2,
    question: 'Đặc điểm nổi bật nhất về mặt kinh tế để nhận diện "Định hướng XHCN" là gì?',
    options: [
      'Không có người nghèo.',
      'Mọi người đều có lương bằng nhau.',
      'Kinh tế Nhà nước giữ vai trò chủ đạo.',
      'Cấm hoàn toàn các doanh nghiệp nước ngoài.'
    ],
    correctAnswer: 2,
    explanation: 'Kinh tế Nhà nước là công cụ để điều tiết và đảm bảo định hướng xã hội.'
  },
  {
    id: 3,
    question: 'Theo quan điểm Mác - Lênin, sự phân hóa thu nhập trong thời kỳ quá độ được coi là:',
    options: [
      'Sự thất bại của con đường XHCN.',
      'Một hiện tượng tất yếu khách quan do tồn tại nhiều thành phần kinh tế.',
      'Hành vi bóc lột cần bị cấm ngay lập tức.',
      'Dấu hiệu của việc đang quay lại chủ nghĩa tư bản.'
    ],
    correctAnswer: 1,
    explanation: 'Do còn nhiều hình thức phân phối và trình độ lực lượng sản xuất chưa đồng đều.'
  },
  {
    id: 4,
    question: 'Tiêu chí nào là "Kim chỉ nam" cao nhất của định hướng XHCN?',
    options: [
      'Chỉ số tăng trưởng GDP cao nhất thế giới.',
      'Mọi cá nhân đều làm việc trong các nhà máy nhà nước.',
      'Dân giàu, nước mạnh, dân chủ, công bằng, văn minh.',
      'Xóa bỏ hoàn toàn tiền tệ trong lưu thông.'
    ],
    correctAnswer: 2,
    explanation: 'Đây là mục tiêu tổng quát, lấy con người làm trung tâm.'
  },
  {
    id: 5,
    question: 'Sự khác biệt lớn nhất giữa phân phối trong định hướng XHCN và Chủ nghĩa tư bản là gì?',
    options: [
      'CNXH không thực hiện thu thuế.',
      'CNXH thực hiện phân phối lại để đảm bảo an sinh xã hội và hỗ trợ người yếu thế.',
      'Chủ nghĩa tư bản phân phối tiền cho tất cả mọi người như nhau.',
      'CNXH chỉ phân phối cho người nghèo.'
    ],
    correctAnswer: 1,
    explanation: 'Gắn tăng trưởng kinh tế với tiến bộ và công bằng xã hội.'
  }
];

export default function PresentationPage() {
  const [scrolled, setScrolled] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});

  const correctCount = Object.keys(selectedAnswers).filter((id) => {
    const questionId = Number(id);
    const question = quizData.find((q) => q.id === questionId);
    return selectedAnswers[questionId] === question?.correctAnswer;
  }).length;

  // Hiệu ứng đổi màu Navbar khi cuộn trang
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSelectAnswer = (questionId: number, optionIndex: number) => {
    setSelectedAnswers((prev) => {
      if (prev[questionId] !== undefined) {
        return prev;
      }

      return {
        ...prev,
        [questionId]: optionIndex
      };
    });
  };

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prev) => Math.min(prev + 1, quizData.length - 1));
  };

  const handleRestartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-800 scroll-smooth">

        {/* Nvabar */}
        <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'}`}>
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
              <BookOpen className={scrolled ? 'text-red-700' : 'text-yellow-400'} size={28} />
              <span className={scrolled ? 'text-red-700' : 'text-white'}>MLN<span className="font-light">131</span></span>
            </div>
            <div className={`hidden md:flex gap-6 font-medium text-sm uppercase tracking-wider ${scrolled ? 'text-slate-600' : 'text-white/80'}`}>
              <button type="button" onClick={() => scrollToSection('khai-niem')} className="hover:text-red-600 transition">Nhận định</button>
              <button type="button" onClick={() => scrollToSection('khai-niem')} className="hover:text-red-600 transition">Khái niệm</button>
              <button type="button" onClick={() => scrollToSection('phan-tich')} className="hover:text-red-600 transition">Phân tích</button>
              <button type="button" onClick={() => scrollToSection('ly-luan')} className="hover:text-red-600 transition">Lý luận</button>
              <button type="button" onClick={() => scrollToSection('tieu-chi')} className="hover:text-red-600 transition font-bold text-red-600">Tiêu chí</button>
              <button type="button" onClick={() => scrollToSection('quiz')} className="hover:text-red-600 transition">Quiz</button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative bg-red-800 pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fbbf24 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>

          <div className="relative max-w-5xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-900/50 border border-red-500/30 text-yellow-400 text-sm font-semibold uppercase tracking-widest mb-8 animate-fade-in-up">
              <Flag size={16} /> Chương 3: CNXH và Thời kỳ quá độ
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-12 drop-shadow-lg">
              Con Đường Đi Lên <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">
              Chủ Nghĩa Xã Hội Ở Việt Nam
            </span>
            </h1>

            {/* Khối trích dẫn quan điểm */}
            <div className="bg-white rounded-2xl p-8 md:p-10 shadow-2xl max-w-4xl mx-auto transform hover:-translate-y-1 transition duration-500">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="text-amber-500" size={48} />
              </div>
              <p className="text-xl md:text-2xl font-medium text-slate-700 italic leading-relaxed mb-6">
                "Theo chủ nghĩa Mác - Lênin, chừng nào <span className="font-bold text-red-700">kinh tế tư nhân còn tồn tại</span> và người lao động còn <span className="font-bold text-red-700">bị phân hóa thu nhập</span>, thì chứng tỏ Việt Nam chưa thực sự đi theo con đường xã hội chủ nghĩa."
              </p>
              <div className="inline-block px-6 py-3 bg-red-100 text-red-800 font-bold rounded-lg border border-red-200">
                Nhận định của nhóm: HOÀN TOÀN SAI
              </div>
            </div>
          </div>

          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 animate-bounce">
            <button type="button" onClick={() => scrollToSection('khai-niem')} className="text-white/50 hover:text-white transition">
              <ChevronDown size={32} />
            </button>
          </div>
        </section>

        {/* I. NHẬN ĐỊNH VỀ QUAN ĐIỂM (Khái niệm) */}
        <section id="khai-niem" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-800 uppercase tracking-wide mb-4">I. Nhận định về quan điểm</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">Để hiểu vì sao quan điểm trên là sai, trước hết cần làm rõ các định nghĩa nền tảng của Chủ nghĩa Mác - Lênin.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
              {/* 1. CNXH là gì? */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <BookOpen size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">1. Chủ nghĩa xã hội là gì?</h3>
                </div>

                <div className="space-y-4">
                  <div className="p-5 rounded-xl border border-slate-100 bg-slate-50 hover:border-red-200 transition">
                    <h4 className="font-bold text-red-700 mb-2">Là phong trào đấu tranh thực tiễn</h4>
                    <p className="text-slate-600 text-sm">Phong trào của giai cấp công nhân chống lại sự áp bức, bóc lột của giai cấp tư sản để tự giải phóng.</p>
                  </div>
                  <div className="p-5 rounded-xl border border-slate-100 bg-slate-50 hover:border-red-200 transition">
                    <h4 className="font-bold text-red-700 mb-2">Là trào lưu tư tưởng, lý luận</h4>
                    <p className="text-slate-600 text-sm">Hệ thống quan niệm, học thuyết phản ánh lý tưởng giải phóng con người (CNXH không tưởng, CNXH khoa học).</p>
                  </div>
                  <div className="p-5 rounded-xl border border-red-200 bg-red-50 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg uppercase">Quan trọng nhất</div>
                    <h4 className="font-bold text-red-800 mb-2">Là một chế độ xã hội</h4>
                    <p className="text-slate-700 text-sm">Giai đoạn thấp (đầu) của hình thái KT-XH Cộng sản chủ nghĩa. Ra đời sau khi lật đổ CNTB, là bước đệm tiến tới CN Cộng sản.</p>
                  </div>
                </div>
              </div>

              {/* 2. Đi theo con đường CNXH */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0">
                    <Flag size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800">2. Đi theo con đường CNXH là gì?</h3>
                </div>

                <ul className="space-y-4">
                  {[
                    "Giải phóng giai cấp, dân tộc, xã hội, con người; phát triển toàn diện.",
                    "Kinh tế phát triển cao (LLSX hiện đại, công hữu TLSX chủ yếu).",
                    "Xã hội do nhân dân lao động làm chủ.",
                    "Nhà nước mang bản chất giai cấp công nhân, đại biểu cho nhân dân.",
                    "Văn hóa phát triển cao, kế thừa tinh hoa dân tộc & nhân loại.",
                    "Bình đẳng, đoàn kết dân tộc và hữu nghị quốc tế."
                  ].map((item, idx) => (
                      <li key={idx} className="flex gap-3 items-start">
                        <CheckCircle2 className="text-green-500 mt-1 shrink-0" size={20} />
                        <span className="text-slate-700 leading-relaxed">{item}</span>
                      </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Phân tích sâu: Sai lầm của quan điểm */}
        <section id="phan-tich" className="py-20 bg-slate-100 border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="bg-red-800 text-white rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-700 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>

              <h3 className="text-2xl md:text-3xl font-bold mb-8 relative z-10">Tại sao phát biểu trên là sai lầm?</h3>
              <p className="text-red-100 text-lg mb-10 relative z-10 max-w-3xl">
                Người đưa ra phát biểu này đã lấy lý tưởng của CNXH đã phát triển hoàn thiện để áp đặt làm thước đo cho Việt Nam - một quốc gia đang trong <strong>Thời kỳ quá độ</strong>.
              </p>

              <div className="grid md:grid-cols-2 gap-8 relative z-10">
                {/* Box 1: Kinh tế tư nhân */}
                <div className="bg-white text-slate-800 rounded-2xl p-6 shadow-lg">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                    <Briefcase size={24} />
                  </div>
                  <h4 className="text-xl font-bold mb-3">2.1 Kinh tế tư nhân: <br/><span className="text-blue-600">"Động lực" chứ không phải "Kẻ thù"</span></h4>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li><strong>Quan niệm cũ:</strong> CNXH là xóa bỏ tư hữu ngay lập tức.</li>
                    <li><strong>Lý thuyết Lenin (NEP):</strong> Sử dụng kinh tế tư bản tư nhân là cần thiết để phát triển LLSX khi trình độ còn thấp.</li>
                    <li><strong>Thực tế VN:</strong> KT tư nhân là "động lực quan trọng" giúp huy động vốn, tạo việc làm.</li>
                    <li className="pt-2 border-t border-slate-200 text-blue-800 font-medium">
                      {"=>"} Chừng nào còn chịu sự quản lý của Nhà nước pháp quyền XHCN, nó vẫn phục vụ lộ trình đi lên CNXH.
                    </li>
                  </ul>
                </div>

                {/* Box 2: Phân hóa thu nhập */}
                <div className="bg-white text-slate-800 rounded-2xl p-6 shadow-lg">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <Scale size={24} />
                  </div>
                  <h4 className="text-xl font-bold mb-3">2.2 Phân hóa thu nhập: <br/><span className="text-emerald-600">Hệ quả của nguyên tắc công bằng</span></h4>
                  <ul className="space-y-3 text-sm text-slate-600">
                    <li><strong>Lầm tưởng:</strong> CNXH là "cào bằng" mọi người.</li>
                    <li><strong>Nguyên tắc phân phối:</strong> "Làm theo năng lực, hưởng theo lao động". Đóng góp nhiều thì thu nhập cao {"->"} Tất yếu dẫn đến chênh lệch.</li>
                    <li><strong>Sự khác biệt:</strong> Nhà nước dùng thuế, phúc lợi để điều tiết, không để chênh lệch thành phân hóa giai cấp đối kháng hay bóc lột cùng cực.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* II. LÝ LUẬN CỦA LÊNIN & MÁC */}
        <section id="ly-luan" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-800 uppercase tracking-wide mb-4">II. Căn Cứ Lý Luận (Mác - Lênin)</h2>
              <p className="text-slate-500 max-w-2xl mx-auto">Sự tồn tại của các yếu tố tư bản trong xã hội đang xây dựng CNXH không phải là chệch hướng, mà là quy luật khách quan của Thời kỳ quá độ.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              {/* Cột 1: Quá độ là gì */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 h-full">
                  <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
                    <Landmark size={20} /> 1. Thời kỳ quá độ là gì?
                  </h3>
                  <div className="space-y-4 text-sm text-slate-600">
                    <p><strong>Thực chất:</strong> Cải biến cách mạng từ xã hội tiền TBCN/TBCN sang XHCN.</p>
                    <p><strong>Đặc điểm:</strong> Sự <em>đan xen</em> của nhiều tàn dư xã hội cũ và yếu tố mới phát sinh, chưa phải CNXH hoàn chỉnh.</p>
                    <p><strong>Tính chất:</strong> Cải tạo sâu sắc, triệt để trên mọi lĩnh vực để xây dựng cơ sở vật chất - kỹ thuật.</p>
                    <p><strong>Thời gian:</strong> Lâu dài, gian khổ, từ khi giành chính quyền đến khi xây dựng thành công CNXH.</p>
                  </div>
                </div>
              </div>

              {/* Cột 2 & 3: Tồn tại điều gì */}
              <div className="lg:col-span-2">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <TrendingUp className="text-red-600" size={24} /> 2. Thời kỳ quá độ tất yếu tồn tại điều gì?
                </h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  {[
                    { icon: Briefcase, title: 'Kinh tế', color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Tồn tại nền kinh tế nhiều thành phần (VD: 5 thành phần thời NEP của Lenin).' },
                    { icon: Shield, title: 'Chính trị', color: 'text-red-600', bg: 'bg-red-50', desc: 'Thiết lập chuyên chính vô sản, tiếp tục đấu tranh giai cấp.' },
                    { icon: Lightbulb, title: 'Tư tưởng - Văn hóa', color: 'text-amber-500', bg: 'bg-amber-50', desc: 'Đan xen tư tưởng khác nhau, chủ yếu là đấu tranh giữa vô sản và tư sản.' },
                    { icon: Users, title: 'Xã hội', color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Tồn tại nhiều giai cấp hợp tác/đấu tranh. Còn khác biệt thành thị - nông thôn.' }
                  ].map((item, idx) => (
                      <div key={idx} className="flex gap-4 p-5 rounded-xl border border-slate-100 hover:shadow-md transition bg-white">
                        <div className={`w-10 h-10 shrink-0 rounded-lg ${item.bg} ${item.color} flex items-center justify-center`}>
                          <item.icon size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 mb-1">{item.title}</h4>
                          <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mục tiêu cuối cùng của CNXH */}
            <div className="bg-slate-900 rounded-3xl p-8 md:p-10 text-white mt-12 shadow-2xl">
              <h3 className="text-2xl font-bold text-yellow-400 mb-8 flex items-center gap-3">
                <Gift size={28} /> 3. Mục Tiêu Cuối Cùng Của CNXH
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { icon: Unlock, title: 'Giải phóng toàn diện', desc: 'Giải phóng giai cấp, dân tộc, xã hội và con người. Bản chất nhân văn, nhân đạo sâu sắc.' },
                  { icon: HeartHandshake, title: 'Xóa bỏ bóc lột', desc: 'Tiêu diệt tình trạng người bóc lột người, xóa bỏ phân chia giai cấp trong xã hội.' },
                  { icon: Target, title: 'Phân phối lý tưởng', desc: 'Tiến tới nguyên tắc phân phối tuyệt đối: "Làm theo năng lực, hưởng theo nhu cầu".' },
                  { icon: Globe, title: 'Thiết lập xã hội CS', desc: 'Tạo ra tiền đề vật chất & tinh thần khổng lồ để xã hội Cộng sản thực sự hình thành.' }
                ].map((goal, idx) => (
                    <div key={idx} className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                      <div className="text-yellow-400 mb-4"><goal.icon size={24} /></div>
                      <h4 className="text-md font-bold text-white mb-2">{goal.title}</h4>
                      <p className="text-slate-400 text-sm leading-relaxed">{goal.desc}</p>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* III. NHẬN ĐỊNH CỦA NHÓM (TIÊU CHÍ ĐÁNH GIÁ) */}
        <section id="tieu-chi" className="py-20 bg-red-50 border-t border-red-100">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-red-800 uppercase tracking-wide mb-4">
                III. Nhận định của nhóm
              </h2>
              <p className="text-lg md:text-xl text-red-600/80 font-medium max-w-3xl mx-auto">
                Những tiêu chí để đánh giá một xã hội có đi theo định hướng XHCN
              </p>
            </div>

            <div className="section-video-container section-video-frame mb-12">
              <video className="section-video" controls preload="metadata">
                <source src="/assets/videop3.mp4" type="video/mp4" />
                Trình duyệt của bạn không hỗ trợ phát video.
              </video>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Tiêu chí 1: Kinh tế */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border-b-4 border-blue-600 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <Landmark size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">1. Tiêu chí Kinh tế</h3>
                <p className="text-blue-600 font-medium text-sm mb-4">(Cốt lõi về cơ sở hạ tầng)</p>
                <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
                  <p>Nền kinh tế có nhiều thành phần, nhưng <strong>Kinh tế Nhà nước phải giữ vai trò chủ đạo</strong>.</p>
                  <p><span className="font-semibold text-slate-800">Mục đích:</span> Nhà nước nắm giữ các "yết hầu" kinh tế (tài nguyên, ngân hàng...) để dẫn dắt, điều tiết tư nhân, ngăn chặn tư bản độc quyền thao túng.</p>
                </div>
              </div>

              {/* Tiêu chí 2: Chính trị */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border-b-4 border-red-600 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <Shield size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">2. Tiêu chí Chính trị</h3>
                <p className="text-red-600 font-medium text-sm mb-4">(Điều kiện tiên quyết)</p>
                <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                  <div>
                    <span className="font-bold text-slate-800 block mb-1">Sự lãnh đạo của Đảng:</span>
                    Duy trì sự lãnh đạo duy nhất của Đảng Cộng sản để đảm bảo xã hội không chệch hướng sang TBCN.
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block mb-1">Bản chất Nhà nước:</span>
                    Nhà nước pháp quyền XHCN "của dân, do dân, vì dân". Mọi chính sách phải phục vụ lợi ích của đại đa số người lao động.
                  </div>
                </div>
              </div>

              {/* Tiêu chí 3: Xã hội & Phân phối */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border-b-4 border-emerald-500 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <Scale size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">3. Tiêu chí Xã hội & Phân phối</h3>
                <p className="text-emerald-600 font-medium text-sm mb-4">(Thước đo nhân văn)</p>
                <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                  <div>
                    <span className="font-bold text-slate-800 block mb-1">Tăng trưởng đi đôi với công bằng:</span>
                    Không hy sinh môi trường hay bóc lột lao động chỉ để chạy theo tăng trưởng GDP.
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block mb-1">Về phân phối:</span>
                    Phân phối theo kết quả lao động kết hợp với điều tiết an sinh xã hội (thuế, quỹ phúc lợi...) để hỗ trợ người yếu thế, <strong>đảm bảo không ai bị bỏ lại phía sau</strong>.
                  </div>
                </div>
              </div>

              {/* Tiêu chí 4: Mục tiêu tổng quát */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border-b-4 border-amber-500 hover:-translate-y-2 transition-transform duration-300">
                <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                  <Target size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">4. Mục tiêu tổng quát</h3>
                <p className="text-amber-600 font-medium text-sm mb-4">(Kim chỉ nam)</p>
                <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
                  <p>Mục tiêu cuối cùng mà mọi hoạt động kinh tế, chính trị, văn hóa của xã hội đó hướng tới phải là: <strong className="text-amber-600 uppercase">"Dân giàu, nước mạnh, dân chủ, công bằng, văn minh"</strong>.</p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Lấy con người làm trung tâm của sự phát triển.</li>
                    <li>Sự phát triển của cá nhân phải gắn liền với sự phát triển của cộng đồng.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="quiz" className="scroll-content quiz-scroll-content premium-quiz-thematic">
          <div className="quiz-header-card">
            <h2 className="quiz-main-title">🎯 KIỂM TRA KIẾN THỨC</h2>
            <p className="quiz-main-desc">Hãy cùng ôn lại các kiến thức trọng tâm vừa rồi qua bộ câu hỏi trắc nghiệm dưới đây.</p>
          </div>

          <div className="premium-quiz-container">
            <div className="quiz-progress-header">
              <div className="progress-info">
                <span className="question-count">Câu {currentQuestionIndex + 1} / {quizData.length}</span>
                <span className="correct-count">{correctCount} đúng</span>
              </div>
              <div className="progress-track">
                {quizData.map((q, idx) => {
                  const answer = selectedAnswers[q.id];
                  const isCorrect = answer === q.correctAnswer;
                  const isCurrent = idx === currentQuestionIndex;
                  const isAnswered = answer !== undefined;

                  let trackClass = 'track-segment';
                  if (isCurrent) trackClass += ' active';
                  if (isAnswered) {
                    trackClass += isCorrect ? ' correct' : ' wrong';
                  }

                  return <div key={q.id} className={trackClass} />;
                })}
              </div>
            </div>

            <div className="premium-quiz-card">
              {quizData.map((q, idx) => {
                if (idx !== currentQuestionIndex) return null;

                const answered = selectedAnswers[q.id] !== undefined;

                return (
                  <div key={q.id} className="question-item animate-in">
                    <div className="question-header">
                      <span className="q-badge">{idx + 1}</span>
                      <h3 className="premium-question-text">{q.question}</h3>
                    </div>

                    <div className="premium-options">
                      {q.options.map((option, oIdx) => {
                        const isSelected = selectedAnswers[q.id] === oIdx;
                        const isCorrect = oIdx === q.correctAnswer;

                        let btnClass = 'premium-option-btn';
                        if (answered) {
                          if (isCorrect) btnClass += ' correct';
                          else if (isSelected) btnClass += ' wrong';
                          else btnClass += ' inactive';
                        }

                        return (
                          <button
                            key={oIdx}
                            className={btnClass}
                            onClick={() => handleSelectAnswer(q.id, oIdx)}
                            disabled={answered}
                          >
                            <span className="premium-option-letter">{['A', 'B', 'C', 'D'][oIdx]}</span>
                            <span className="option-text-content">{option}</span>
                          </button>
                        );
                      })}
                    </div>

                    {answered && (
                      <div className="quiz-action-area animate-fade-in">
                        <div className={`premium-feedback-box ${selectedAnswers[q.id] === q.correctAnswer ? 'success' : 'error'}`}>
                          <p className="feedback-message">
                            <strong>{selectedAnswers[q.id] === q.correctAnswer ? 'Chính xác! ' : 'Chưa đúng. '}</strong>
                            {q.explanation}
                          </p>
                        </div>

                        {currentQuestionIndex < quizData.length - 1 ? (
                          <button className="next-quiz-btn" onClick={handleNextQuestion}>
                            Tiếp tục câu tiếp theo {'->'}
                          </button>
                        ) : (
                          <button className="finish-quiz-btn" onClick={handleRestartQuiz}>
                            Làm lại bài trắc nghiệm
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-950 py-8 border-t border-slate-800 text-center">
          <div className="flex items-center justify-center gap-2 text-yellow-500/50 mb-2">
            <BookOpen size={20} />
            <span className="font-bold tracking-widest uppercase">MLN131</span>
          </div>
          <p className="text-slate-600 text-sm">Bài thuyết trình môn Triết học Mác - Lênin. Thiết kế hỗ trợ học tập.</p>
        </footer>
      </div>
  );
}
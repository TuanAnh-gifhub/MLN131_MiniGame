import React, { useState, useEffect } from 'react';
import './PresentationPage.css';

interface ContentItem {
  quote?: string;
  isCounterArgument?: boolean;
  heading?: string;
  detail?: string;
}

interface SlideSection {
  id: string;
  title: string;
  subtitle?: string;
  type?: 'cover';
  icon: string;
  image?: string;
  video?: string;
  metrics?: { label: string; value: string; icon: string }[];
  content: (string | ContentItem)[];
}



interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const quizData: QuizQuestion[] = [
  {
    id: 1,
    question: "Tại sao trong thời kỳ quá độ lên CNXH, kinh tế tư nhân vẫn được phép tồn tại?",
    options: [
      "Vì Nhà nước không đủ nguồn lực để quản lý tất cả.",
      "Để tận dụng vốn, công nghệ và sức sản xuất nhằm phát triển kinh tế.",
      "Vì CNXH không có ý định xóa bỏ kinh tế tư nhân.",
      "Vì áp lực từ các tổ chức quốc tế."
    ],
    correctAnswer: 1,
    explanation: "Đây là giải pháp chiến lược để phát triển lực lượng sản xuất trong thời kỳ quá độ."
  },
  {
    id: 2,
    question: "Đặc điểm nổi bật nhất về mặt kinh tế để nhận diện 'Định hướng XHCN' là gì?",
    options: [
      "Không có người nghèo.",
      "Mọi người đều có lương bằng nhau.",
      "Kinh tế Nhà nước giữ vai trò chủ đạo.",
      "Cấm hoàn toàn các doanh nghiệp nước ngoài."
    ],
    correctAnswer: 2,
    explanation: "Kinh tế Nhà nước là công cụ để điều tiết và đảm bảo định hướng xã hội."
  },
  {
    id: 3,
    question: "Theo quan điểm Mác - Lênin, sự phân hóa thu nhập trong thời kỳ quá độ được coi là:",
    options: [
      "Sự thất bại của con đường XHCN.",
      "Một hiện tượng tất yếu khách quan do tồn tại nhiều thành phần kinh tế.",
      "Hành vi bóc lột cần bị cấm ngay lập tức.",
      "Dấu hiệu của việc đang quay lại chủ nghĩa tư bản."
    ],
    correctAnswer: 1,
    explanation: "Do còn nhiều hình thức phân phối và trình độ lực lượng sản xuất chưa đồng đều."
  },
  {
    id: 4,
    question: "Tiêu chí nào là 'Kim chỉ nam' cao nhất của định hướng XHCN?",
    options: [
      "Chỉ số tăng trưởng GDP cao nhất thế giới.",
      "Mọi cá nhân đều làm việc trong các nhà máy nhà nước.",
      "Dân giàu, nước mạnh, dân chủ, công bằng, văn minh.",
      "Xóa bỏ hoàn toàn tiền tệ trong lưu thông."
    ],
    correctAnswer: 2,
    explanation: "Đây là mục tiêu tổng quát, lấy con người làm trung tâm."
  },
  {
    id: 5,
    question: "Sự khác biệt lớn nhất giữa phân phối trong định hướng XHCN và Chủ nghĩa tư bản là gì?",
    options: [
      "CNXH không thực hiện thu thuế.",
      "CNXH thực hiện phân phối lại để đảm bảo an sinh xã hội và hỗ trợ người yếu thế.",
      "Chủ nghĩa tư bản phân phối tiền cho tất cả mọi người như nhau.",
      "CNXH chỉ phân phối cho người nghèo."
    ],
    correctAnswer: 1,
    explanation: "Gắn tăng trưởng kinh tế với tiến bộ và công bằng xã hội."
  }
];

const PresentationPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState(0); // Keeping for potential use or header sync
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleSelectAnswer = (questionId: number, optionIndex: number) => {
    if (selectedAnswers[questionId] !== undefined) return;
    setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handleRestartQuiz = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
  };

  const sections: SlideSection[] = [
    {
      id: 'intro',
      title: 'Xây dựng Chủ nghĩa Xã hội tại Việt Nam',
      subtitle: 'Phê phán các quan điểm sai lầm về kinh tế tư nhân và phân hóa thu nhập',
      type: 'cover',
      icon: '☭',
      content: []
    },
    {
      id: 'part1',
      title: 'PHẦN 1: ĐẶT VẤN ĐỀ & PHẢN BIỆN TRỰC DIỆN',
      icon: '⚖️',
      image: '/assets/part1.png',
      content: [
        {
          quote: "Chừng nào kinh tế tư nhân còn tồn tại và người lao động còn bị phân hóa thu nhập, thì chứng tỏ Việt Nam chưa thực sự đi theo con đường XHCN.",
          isCounterArgument: true
        },
        "Đây là một nhận định sai lầm do hiểu chưa đầy đủ về lý luận.",
        "Cần làm rõ hai khái niệm nền tảng:",
        "• CNXH: Chế độ xã hội cụ thể - giai đoạn đầu của hình thái Cộng sản.",
        "• Con đường XHCN: Hành trình giải phóng con người, xây dựng nền kinh tế cao dựa trên công hữu.",
        "Chốt vấn đề: Sai lầm nằm ở việc lấy kết quả cuối cùng để áp đặt làm tiêu chuẩn cho vạch xuất phát."
      ]
    },
    {
      id: 'part2',
      title: 'PHẦN 2: CƠ SỞ LÝ LUẬN - TẠI SAO LẠI CÓ SỰ "ĐAN XEN"?',
      icon: '📜',
      image: '/assets/part2.png',
      content: [
        {
          heading: '1. Thời kỳ quá độ là gì',
          detail: "Thời kỳ quá độ là một cuộc chạy tiếp sức lâu dài, nơi chúng ta chấp nhận sự tồn tại của kinh tế tư nhân như một động lực sản xuất, nhưng dưới sự cầm lái của Đảng và sự điều tiết của Nhà nước để tiến tới mục tiêu công bằng xã hội. "
        },
        {
          heading: '2. Bản chất của Thời kỳ quá độ',
          detail: "Lênin: 'Cải biến cách mạng' lâu dài và gian khổ. Không phải là một cái búng tay.\n• Kinh tế: Tất yếu tồn tại nền kinh tế nhiều thành phần.\n• Chính trị: Cuộc đấu tranh giữa cái cũ và cái mới.\n• Xã hội: Phân hóa giàu nghèo là điều khó tránh khỏi."
        },
        {
          heading: '3. Mục tiêu cuối cùng của chủ nghĩa xã hội',
          detail: "• Mục tiêu: Xóa bỏ bóc lột, giải phóng con người toàn diện.\n• Nguyên tắc: 'Làm theo năng lực, hưởng theo nhu cầu'.\n• Thực tế: Cần kinh tế nhiều thành phần để tạo ra của cải dồi dào."
        }
      ]
    },
    {
      id: 'part3',
      title: 'PHẦN 3: NHẬN ĐỊNH CỦA NHÓM',
      icon: '📊',
      video: '/assets/videop3.mp4',
      metrics: [
        { label: "Kinh tế", value: "Nhà nước", icon: "🏛️" },
        { label: "Chính trị", value: "Đảng lãnh đạo", icon: "🛡️" },
        { label: "Xã hội", value: "Công bằng", icon: "⚖️" },
        { label: "Mục tiêu", value: "Dân giàu", icon: "🌟" }
      ],
      content: [
        {
          heading: "1. Tiêu chí Kinh tế",
          detail: "Kinh tế Nhà nước giữ vai trò chủ đạo, kiểm soát các lĩnh vực 'yết hầu' (năng lượng, tài nguyên, ngân hàng) để ngăn chặn thao túng độc quyền."
        },
        {
          heading: "2. Tiêu chí Chính trị",
          detail: "Đảm bảo sự lãnh đạo của Đảng Cộng sản & Nhà nước pháp quyền XHCN phục vụ đại đa số nhân dân lao động."
        },
        {
          heading: "3. Tiêu chí Xã hội",
          detail: "Tăng trưởng gắn liền với công bằng xã hội. Phân phối lại qua thuế/phúc lợi để không ai bị bỏ lại phía sau."
        },
        {
          heading: "4. Tiêu chí Mục tiêu",
          detail: "'Dân giàu, nước mạnh, dân chủ, công bằng, văn minh'. Con người là trung tâm, là chủ thể phát triển."
        }
      ]
    },

    {
      id: 'part4',
      title: 'PHẦN 4: LIÊM CHÍNH & SÁNG TẠO',
      icon: '🛡️',
      image: '/assets/part5.png',
      content: [
        {
          heading: "1. Minh bạch AI Usage",
          detail: "Nhóm sử dụng AI (ChatGPT-4o, Claude 3.5 Sonnet) để hỗ trợ cấu trúc dàn ý, tra cứu thuật ngữ và tối ưu hóa mã nguồn Frontend. Toàn bộ nội dung lý luận được kiểm chứng lại bởi con người."
        },
        {
          heading: "2. Kiểm chứng thông tin",
          detail: "Sử dụng nguồn chính thống từ: Văn kiện Đại hội XIII của Đảng, Giáo trình Tư tưởng Hồ Chí Minh (Bộ GD&ĐT), và các bài viết lý luận trên Tạp chí Cộng sản."
        },
        {
          heading: "3. Liêm chính học thuật",
          detail: "Cam kết không sao chép nguyên bản, không đạo văn. Mọi quan điểm phản biện được nhóm tự tổng hợp và diễn đạt theo ngôn ngữ học thuật riêng."
        },
        {
          heading: "4. Ứng dụng sáng tạo",
          detail: "Chuyển đổi nội dung lý luận khô khan thành giao diện Web tương tác (Mini-game, Slide cuộn) giúp tăng tính tiếp cận và khả năng tự học cho sinh viên."
        }
      ]
    },
    {
      id: 'part5',
      title: 'PHẦN 5: KẾT LUẬN',
      icon: '🏁',
      image: '/assets/part4.png',
      content: [
        "Kinh tế tư nhân và phân hóa thu nhập chỉ là đặc điểm mang tính lịch sử của thời kỳ quá độ.",
        "Không thể dùng đó làm căn cứ để khẳng định đi chệch hướng XHCN.",
        "Cốt lõi là: Vai trò chủ đạo của KT Nhà nước, lãnh đạo của Đảng và mục tiêu vì con người.",
      ]
    }
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="presentation-scroll-container">
      {/* Sticky Header */}
      <header className="scroll-header">
        <div className="header-logo">
          <span className="logo-box">MLN</span>
          <span className="logo-text">Nhóm 2 - MLN131</span>
        </div>
        <nav className="header-nav">
          {sections.map((section) => (
            <button
              key={section.id}
              className="nav-link"
              onClick={() => scrollToSection(section.id)}
            >
              {section.title.split(':')[0].replace('PHẦN ', 'P')}
            </button>
          ))}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="scroll-content">
        {sections.map((section) => (
          <section
            key={section.id}
            id={section.id}
            className={`scroll-section ${section.type === 'cover' ? 'section-cover' : ''}`}
          >
            <div className="section-card">
              <div className="card-header">
                <span className="section-icon">{section.icon}</span>
                <div className="title-group">
                  <h2 className="section-title">{section.title}</h2>
                  {section.subtitle && <h3 className="section-subtitle">{section.subtitle}</h3>}
                </div>
              </div>

              {section.image && (
                <div className="section-image-container">
                  <img src={section.image} alt={section.title} className="section-img" />
                </div>
              )}

              {section.video && (
                <div className="section-video-container">
                  <video
                    src={section.video}
                    className="section-video"
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                </div>
              )}

              {section.metrics && (
                <div className="metric-row">
                  {section.metrics.map((m, mIdx) => (
                    <div key={mIdx} className="metric-card animate-in" style={{ animationDelay: `${mIdx * 0.1}s` }}>
                      <span className="metric-icon">{m.icon}</span>
                      <span className="metric-value">{m.value}</span>
                      <span className="metric-label">{m.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className={`card-body ${['part2', 'part3', 'part4'].includes(section.id) ? 'grid-layout' : ''}`}>
                {section.content && section.content.map((item, idx) => {
                  if (typeof item === 'string') {
                    return <p key={idx} className="body-text">{item}</p>;
                  } else {
                    const obj = item as ContentItem;
                    return (
                      <div key={idx} className={`feature-box ${obj.isCounterArgument ? 'counter-feature' : 'detail-feature'}`}>
                        {obj.quote && <blockquote className="feature-quote">"{obj.quote}"</blockquote>}
                        {obj.heading && <h4 className="feature-heading">{obj.heading}</h4>}
                        {obj.detail && <p className="feature-detail">{obj.detail}</p>}
                      </div>
                    );
                  }
                })}
              </div>

              {section.type === 'cover' && (
                <button
                  className="explore-btn"
                  onClick={() => scrollToSection(sections[1].id)}
                >
                  Bắt đầu tìm hiểu nội dung
                </button>
              )}
            </div>
          </section>
        ))}
      </main>

      {/* Interactive Quiz Section */}
      <section id="quiz" className="scroll-content quiz-scroll-content premium-quiz-thematic">
        <div className="quiz-header-card">
          <h2 className="quiz-main-title">🎯 KIỂM TRA KIẾN THỨC</h2>
          <p className="quiz-main-desc">Hãy cùng ôn lại các kiến thức trọng tâm vừa rồi qua bộ câu hỏi trắc nghiệm dưới đây.</p>
        </div>

        <div className="premium-quiz-container">
          {/* Progress Header */}
          <div className="quiz-progress-header">
            <div className="progress-info">
              <span className="question-count">Câu {currentQuestionIndex + 1} / {quizData.length}</span>
              <span className="correct-count">
                {Object.keys(selectedAnswers).filter(id => selectedAnswers[Number(id)] === quizData.find(q => q.id === Number(id))?.correctAnswer).length} đúng
              </span>
            </div>
            <div className="progress-track">
              {quizData.map((q, idx) => {
                const answer = selectedAnswers[q.id];
                const isCorrect = answer === q.correctAnswer;
                const isCurrent = idx === currentQuestionIndex;
                const isAnswered = answer !== undefined;

                let trackClass = "track-segment";
                if (isCurrent) trackClass += " active";
                if (isAnswered) {
                  trackClass += isCorrect ? " correct" : " wrong";
                }

                return <div key={q.id} className={trackClass} />;
              })}
            </div>
          </div>

          {/* Question Card */}
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
                      const showResult = answered;

                      let btnClass = "premium-option-btn";
                      if (showResult) {
                        if (isCorrect) btnClass += " correct";
                        else if (isSelected) btnClass += " wrong";
                        else btnClass += " inactive";
                      }

                      return (
                        <button
                          key={oIdx}
                          className={btnClass}
                          onClick={() => handleSelectAnswer(q.id, oIdx)}
                          disabled={showResult}
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
                          Tiếp tục câu tiếp theo →
                        </button>
                      ) : (
                        <button className="finish-quiz-btn" onClick={handleRestartQuiz}>
                          Làm lại bài trắc nghiệm ↺
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
      <footer className="scroll-footer">
        <p>© 2026 - Nhóm 2 - Đề tài Xây dựng Chủ nghĩa Xã hội tại Việt Nam</p>
      </footer>
    </div>
  );
};

export default PresentationPage;

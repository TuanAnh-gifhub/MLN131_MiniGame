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
  content: (string | ContentItem)[];
}

const PresentationPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState(0);

  const sections: SlideSection[] = [
    {
      id: 'intro',
      title: 'Xây dựng Chủ nghĩa Xã hội tại Việt Nam',
      subtitle: 'Phê phán các quan điểm sai lầm về kinh tế tư nhân và phân hóa thu nhập',
      type: 'cover',
      content: []
    },
    {
      id: 'part1',
      title: 'PHẦN 1: ĐẶT VẤN ĐỀ & PHẢN BIỆN TRỰC DIỆN',
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
      id: 'part2-1',
      title: 'PHẦN 2: CƠ SỞ LÝ LUẬN - TẠI SAO LẠI CÓ SỰ "ĐAN XEN"?',
      subtitle: '1. Bản chất của Thời kỳ quá độ',
      content: [
        "Lênin: 'Cải biến cách mạng' lâu dài và gian khổ. Không phải là một cái búng tay.",
        "Kinh tế: Tất yếu tồn tại nền kinh tế nhiều thành phần. Tận dụng mọi nguồn lực phát triển sản xuất.",
        "Chính trị: Cuộc đấu tranh giữa cái cũ (tư sản) và cái mới (vô sản).",
        "Xã hội: Phân hóa giàu nghèo, khác biệt thành thị - nông thôn là điều khó tránh khỏi."
      ]
    },
    {
      id: 'part2-2',
      title: 'PHẦN 2: CƠ SỞ LÝ LUẬN - TẠI SAO LẠI CÓ SỰ "ĐAN XEN"?',
      subtitle: '2. Mục tiêu cuối cùng - Kim chỉ nam',
      content: [
        "Mục tiêu: Xóa bỏ bóc lột, giải phóng con người toàn diện.",
        "Nguyên tắc: 'Làm theo năng lực, hưởng theo nhu cầu'.",
        "Thực tế: Muốn 'hưởng theo nhu cầu' thì của cải phải dồi dào. Để dồi dào, cần kinh tế nhiều thành phần thúc đẩy sản xuất."
      ]
    },
    {
      id: 'part3-1',
      title: 'PHẦN 3: NHẬN ĐỊNH CỦA NHÓM - TIÊU CHÍ ĐÁNH GIÁ (1 & 2)',
      content: [
        {
          heading: "Tiêu chí Kinh tế: Cơ sở hạ tầng & Vai trò chủ đạo",
          detail: "Kinh tế Nhà nước giữ vai trò chủ đạo, kiểm soát các lĩnh vực 'yết hầu' (năng lượng, tài nguyên, ngân hàng) để ngăn chặn thao túng độc quyền."
        },
        {
          heading: "Tiêu chí Chính trị: Bản chất quyền lực",
          detail: "Đảm bảo sự lãnh đạo của Đảng Cộng sản & Nhà nước pháp quyền XHCN phục vụ đại đa số nhân dân lao động."
        }
      ]
    },
    {
      id: 'part3-2',
      title: 'PHẦN 3: NHẬN ĐỊNH CỦA NHÓM - TIÊU CHÍ ĐÁNH GIÁ (3 & 4)',
      content: [
        {
          heading: "Tiêu chí Xã hội & Phân phối: Thước đo nhân văn",
          detail: "Tăng trưởng gắn liền với công bằng xã hội. Phân phối lại qua thuế/phúc lợi để không ai bị bỏ lại phía sau."
        },
        {
          heading: "Tiêu chí Mục tiêu Tổng quát: Kim chỉ nam",
          detail: "'Dân giàu, nước mạnh, dân chủ, công bằng, văn minh'. Con người là trung tâm, là chủ thể phát triển."
        }
      ]
    },
    {
      id: 'conclusion',
      title: 'PHẦN 4: KẾT LUẬN',
      content: [
        "Kinh tế tư nhân và phân hóa thu nhập chỉ là đặc điểm mang tính lịch sử của thời kỳ quá độ.",
        "Không thể dùng đó làm căn cứ để khẳng định đi chệch hướng XHCN.",
        "Cốt lõi là: Vai trò chủ đạo của KT Nhà nước, lãnh đạo của Đảng và mục tiêu vì con người.",
        "Cảm ơn thầy cô và các bạn đã lắng nghe!"
      ]
    }
  ];

  const handleNext = () => {
    if (activeSection < sections.length - 1) {
      setActiveSection(activeSection + 1);
    }
  };

  const handlePrev = () => {
    if (activeSection > 0) {
      setActiveSection(activeSection - 1);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection]);

  const current = sections[activeSection];

  return (
    <div className="presentation-container">
      <div className="presentation-progress" style={{ width: `${((activeSection + 1) / sections.length) * 100}%` }}></div>

      <div className="presentation-slide">
        <div key={activeSection} className={`slide-content ${current.type === 'cover' ? 'slide-cover' : ''}`}>
          {current.type === 'cover' && <div className="section-badge">Giới thiệu</div>}
          <h1 className="slide-title">{current.title}</h1>
          {current.subtitle && <h2 className="slide-subtitle">{current.subtitle}</h2>}

          <div className="content-area">
            {current.content && current.content.map((item, idx) => {
              if (typeof item === 'string') {
                return <p key={idx} className="content-text">{item}</p>;
              } else {
                const obj = item as ContentItem;
                return (
                  <div key={idx} className={`content-box ${obj.isCounterArgument ? 'counter-box' : 'detail-box'}`}>
                    {obj.quote && <blockquote className="content-quote">"{obj.quote}"</blockquote>}
                    {obj.heading && <h3 className="content-heading">{obj.heading}</h3>}
                    {obj.detail && <p className="content-detail">{obj.detail}</p>}
                  </div>
                );
              }
            })}
            {current.type === 'cover' && (
              <button className="start-btn" onClick={handleNext}>Bắt đầu thuyết trình</button>
            )}
          </div>
        </div>
      </div>

      <div className="presentation-nav">
        <button onClick={handlePrev} disabled={activeSection === 0} className="nav-btn prev">←</button>
        <div className="nav-info">{activeSection + 1} / {sections.length}</div>
        <button onClick={handleNext} disabled={activeSection === sections.length - 1} className="nav-btn next">→</button>
      </div>

      <div className="background-decoration">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
    </div>
  );
};

export default PresentationPage;

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { 
  FiUpload, FiMessageSquare, FiCheckCircle, 
  FiArrowRight, FiLoader, FiSend, 
  FiUser, FiCpu, FiChevronDown, FiFileText 
} from 'react-icons/fi';
import './App.css';

type Message = {
  role: 'user' | 'ai';
  content: string;
};

type ApiResponse = {
  conversationId: string;
  initialMessage: string;
};

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [project, setProject] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files;
      }
    }
  };

  const startProcessing = async () => {
    if (!file) {
      alert('Please upload a file');
      return;
    }
    if (!project) {
      alert('Please select a project');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentName', file.name);
      formData.append('project', project);

      // Simulate API call
      const response = await simulateApiCall(formData);
      setConversationId(response.conversationId);
      setMessages([{ role: 'ai', content: response.initialMessage }]);
      setShowChat(true);
    } catch (error) {
      console.error('Error:', error);
      alert('There was an error processing your document. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const simulateApiCall = (formData: FormData): Promise<ApiResponse> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          conversationId: 'conv_' + Math.random().toString(36).substr(2, 9),
          initialMessage: 'Thank you for uploading your PRD. I have a few questions to clarify the requirements before creating the Jira stories...'
        });
      }, 1500);
    });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { 
          role: 'ai', 
          content: 'Thanks for that clarification. Based on this, I can create the user stories with the following acceptance criteria...'
        }
      ]);
      scrollToBottom();
    }, 1500);
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="app bg-gray-50 min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 relative overflow-hidden">
        <div className="shape-blur -top-20 -left-20"></div>
        <div className="shape-blur -bottom-20 -right-20"></div>
        <div className="max-w-5xl mx-auto">
          <HeroSection />
          <HowItWorksSection />
          <UploadSection 
            file={file} 
            project={project} 
            setProject={setProject}
            onFileChange={handleFileChange}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            fileInputRef={fileInputRef}
            onProcess={startProcessing}
            isProcessing={isProcessing}
          />
          {showChat && (
            <ChatModule 
              messages={messages}
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              onSend={sendMessage}
              chatContainerRef={chatContainerRef}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white/90 backdrop-blur-md shadow-sm border-b border-white/30 sticky top-0 z-50 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-indigo-600">Story Pilot</h1>
        <div className="flex space-x-6">
          <a href="#how-it-works" className="nav-link">How It Works</a>
          <a href="#upload-section" className="nav-link">Get Started</a>
        </div>
      </div>
    </nav>
  );
};

const HeroSection: React.FC = () => {
  return (
    <section className="text-center mb-20 relative z-10">
      <h1 className="text-6xl font-bold text-gray-900 mb-6 font-display leading-tight">
        Transform PRDs into Jira Stories <span className="gradient-text">Effortlessly</span>
      </h1>
      <p className="text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
        Let our AI agent understand your requirements and create perfect Jira stories for you
      </p>
      <div className="flex justify-center gap-5">
        <a 
          href="#upload-section" 
          className="gradient-bg hover:shadow-lg text-white px-8 py-4 rounded-xl font-medium transition-all duration-300 transform hover:-translate-y-1 shadow-md"
        >
          Get Started
        </a>
        <a 
          href="#how-it-works" 
          className="border border-gray-200 hover:border-primary hover:text-primary text-gray-700 px-8 py-4 rounded-xl font-medium transition-all duration-300 transform hover:-translate-y-1 shadow-sm hover:shadow-md bg-white"
        >
          How It Works
        </a>
      </div>
    </section>
  );
};

interface StepCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const StepCard: React.FC<StepCardProps> = ({ icon, title, description }) => {
  return (
    <div className="glass-effect p-8 rounded-2xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-white/20">
      <div className="gradient-bg w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto">
        {React.cloneElement(icon as React.ReactElement, { className: 'text-white w-10 h-10' })}
      </div>
      <h3 className="text-2xl font-semibold text-gray-900 mb-3 text-center font-display">{title}</h3>
      <p className="text-gray-600 text-center text-lg">{description}</p>
    </div>
  );
};

const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="mb-20 relative z-10">
      <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center font-display">How Story Pilot Works</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <StepCard 
          icon={<FiUpload />}
          title="1. Upload PRD"
          description="Upload your Product Requirements Document in any format"
        />
        <StepCard 
          icon={<FiMessageSquare />}
          title="2. AI Clarification"
          description="Our AI agent will chat with you to clarify requirements"
        />
        <StepCard 
          icon={<FiCheckCircle />}
          title="3. Jira Creation"
          description="Perfect Jira stories created automatically in your project"
        />
      </div>
    </section>
  );
};

interface UploadSectionProps {
  file: File | null;
  project: string;
  setProject: (project: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onProcess: () => void;
  isProcessing: boolean;
}

const UploadSection: React.FC<UploadSectionProps> = ({ 
  file, 
  project, 
  setProject,
  onFileChange,
  onDragOver,
  onDrop,
  fileInputRef,
  onProcess,
  isProcessing
}) => {
  return (
    <section id="upload-section" className="glass-effect p-10 rounded-2xl shadow-xl mb-20 relative z-10">
      <h2 className="text-3xl font-bold text-gray-900 mb-8 font-display">Start Your Story Creation</h2>
      <div className="space-y-6">
        <div className="border-b pb-6">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">1</div>
            <h3 className="text-xl font-semibold text-gray-800">Upload Your PRD Document</h3>
          </div>
          <div 
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 hover:shadow-inner ${file ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-primary'}`}
            onDragOver={onDragOver}
            onDrop={onDrop}
          >
            <div className="flex flex-col items-center justify-center">
              {file ? (
                <FiFileText className="w-12 h-12 text-indigo-500 mb-4" />
              ) : (
                <FiUpload className="w-12 h-12 text-gray-400 mb-4" />
              )}
              <p className="text-gray-600 mb-2">
                {file ? file.name : 'Drag and drop your file here or'}
              </p>
              <label className="cursor-pointer gradient-bg hover:shadow-lg text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:-translate-y-0.5 shadow-md">
                {file ? 'Change File' : 'Select File'}
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.doc,.docx,.txt" 
                  onChange={onFileChange}
                  ref={fileInputRef}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="border-b pb-6">
          <div className="flex items-center mb-4">
            <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">2</div>
            <h3 className="text-xl font-semibold text-gray-800">Select Jira Project</h3>
          </div>
          <div className="relative">
            <select 
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              value={project}
              onChange={(e) => setProject(e.target.value)}
            >
              <option value="" disabled>Choose your Jira project</option>
              <option value="Knox Teams (KT)">Knox Teams (KT)</option>
              <option value="Story Pilot (SP)">Story Pilot (SP)</option>
              <option value="Mobile App Development (MAD)">Mobile App Development (MAD)</option>
</select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <FiChevronDown className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div>
          <button 
            onClick={onProcess}
            disabled={isProcessing}
            className="w-full gradient-bg hover:shadow-lg text-white py-4 px-6 rounded-xl font-medium transition-all duration-300 transform hover:-translate-y-1 shadow-md flex items-center justify-center"
          >
            <span>{isProcessing ? 'Processing...' : 'Start AI Processing'}</span>
            {isProcessing ? (
              <FiLoader className="ml-2 w-5 h-5 animate-spin" />
            ) : (
              <FiArrowRight className="ml-2 w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

interface ChatModuleProps {
  messages: Message[];
  inputMessage: string;
  setInputMessage: (message: string) => void;
  onSend: () => void;
  chatContainerRef: React.RefObject<HTMLDivElement>;
}

const ChatModule: React.FC<ChatModuleProps> = ({ 
  messages, 
  inputMessage, 
  setInputMessage, 
  onSend,
  chatContainerRef
}) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSend();
    }
  };

  return (
    <section className="glass-effect p-8 rounded-2xl shadow-2xl mb-20 relative z-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">AI Clarification</h2>
        <div className="flex items-center">
          <div className="bg-indigo-100 p-2 rounded-full mr-2">
            <FiCpu className="text-indigo-600 w-5 h-5" />
          </div>
          <span className="text-sm font-medium text-gray-600">Processing your request</span>
        </div>
      </div>
      
      <div 
        ref={chatContainerRef}
        className="h-96 overflow-y-auto mb-4 space-y-4 p-4 border border-gray-200 rounded-lg bg-gray-50"
      >
        {messages.map((msg, index) => (
          <ChatMessage key={index} role={msg.role} content={msg.content} />
        ))}
      </div>
      
      <div className="flex items-center">
        <input 
          type="text" 
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your response here..." 
          className="flex-grow px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-indigo-500 focus:border-indigo-500"
        />
        <button 
          onClick={onSend}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-lg font-medium transition duration-300"
        >
          <FiSend className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};

interface ChatMessageProps {
  role: 'user' | 'ai';
  content: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  return (
    <div className={`flex items-start ${role === 'user' ? 'justify-end' : ''}`}>
      {role === 'ai' && (
        <div className="bg-indigo-100 p-3 rounded-full mr-3">
          <FiCpu className="text-indigo-600 w-5 h-5" />
        </div>
      )}
      <div className="bg-white p-4 rounded-lg shadow-sm max-w-3/4">
        <p className="text-gray-800">{content}</p>
      </div>
      {role === 'user' && (
        <div className="bg-gray-100 p-3 rounded-full ml-3">
          <FiUser className="text-gray-600 w-5 h-5" />
        </div>
      )}
    </div>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="container mx-auto px-4 text-center text-gray-500">
        <p>© {new Date().getFullYear()} Story Pilot. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default App;
```
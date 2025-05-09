import { useState } from 'react'
import ChatBot from 'react-chatbotify'

const ChatBotComponent = () => {
  const [form, setForm] = useState({ name: '', age: '', pet: '', goal: '', issue: '' });

  const config = {botName:"IOT Helper"}
  const flow = {
    start: {
      message: "Hello there! What is your name?",
      function: (params) => setForm((prev) => ({ ...prev, name: params.userInput })),
      path: "ask_age"
    },
    ask_age: {
      message: (params) => `Nice to meet you, ${form.name}! What is your age?`,
      function: (params) => setForm((prev) => ({ ...prev, age: params.userInput })),
      path: async (params) => {
        if (isNaN(Number(params.userInput))) {
          await params.injectMessage("Age needs to be a number!");
          return;
        }
        return "help_today";
      }
    },
    help_today: {
      message: "How can I help you today? Are you looking to analyze data, set up alerts, or customize your dashboard?",
      function: (params) => setForm((prev) => ({ ...prev, goal: params.userInput })),
      path: async (params) => {
        const input = params.userInput.toLowerCase();
        if (input.includes("analyze")) {
          await params.injectMessage("Great! To get started, simply click on the ‘Upload Data’ button at the top. Once your file is uploaded, you’ll be able to see your data visualized in interactive graphs.");
        } else if (input.includes("alerts")) {
          await params.injectMessage("Click on the ‘Alerts’ icon in your dashboard. From there, you can configure real-time notifications via email or push notifications based on your selected thresholds.");
        } else if (input.includes("customize")) {
          await params.injectMessage("You can customize your dashboard by clicking the settings icon on the top right of your dashboard view.");
        }
        return "anomaly_tour";
      }
    },
    anomaly_tour: {
      message: "Would you like a quick tour of our anomaly detection features?",
      path: async (params) => {
        const input = params.userInput.toLowerCase();
        if (input.includes("yes")) {
          await params.injectMessage("Sure! I can guide you through key features like data upload, interactive graphs, alert settings, and our AI-powered insights panel. Just follow my prompts.");
        }
        return "site_navigation";
      }
    },
    site_navigation: {
      message: "Do you need help finding your way around the site?",
      path: async (params) => {
        const input = params.userInput.toLowerCase();
        if (input.includes("lost") || input.includes("help")) {
          await params.injectMessage("Absolutely! Our main menu is on the left. From there, you can access data uploads, view your dashboard, or customize your settings. Let me know which section you’d like to explore.");
        }
        return "auth_help";
      }
    },
    auth_help: {
      message: "Are you having trouble logging in or creating an account?",
      path: async (params) => {
        const input = params.userInput.toLowerCase();
        if (input.includes("log") || input.includes("account")) {
          await params.injectMessage("I’m sorry to hear that. Please click on ‘Forgot Password’ to reset your password, or check if your account is registered correctly. If issues persist, our support team is here to help.");
        }
        return "password_reset";
      }
    },
    password_reset: {
      message: "Would you like to reset your password?",
      path: async (params) => {
        if (params.userInput.toLowerCase().includes("yes")) {
          await params.injectMessage("No worries. Click on ‘Forgot Password’ and enter your registered email address. You’ll receive instructions to reset your password in a few minutes.");
        }
        return "dataset_type";
      }
    },
    dataset_type: {
      message: "What type of dataset are you working with today? (e.g., time-series, IoT sensor data)",
      path: async (params) => {
        if (params.userInput.toLowerCase().includes("time-series")) {
          await params.injectMessage("Excellent! Our system supports time-series data perfectly. Make sure your file includes a timestamp column and sensor readings. If you need help with formatting, I can guide you through it.");
        }
        return "upload_help";
      }
    },
    upload_help: {
      message: "Do you need assistance uploading your dataset?",
      path: async (params) => {
        if (params.userInput.toLowerCase().includes("yes")) {
          await params.injectMessage("Simply click on the ‘Upload Data’ button at the top right, select your file, and follow the on-screen instructions. If your file format is incorrect, you’ll receive an error message with tips on how to fix it.");
        }
        return "anomaly_summary";
      }
    },
    anomaly_summary: {
      message: "Would you like to view a summary of the anomalies detected in your data?",
      path: async (params) => {
        if (params.userInput.toLowerCase().includes("summary")) {
          await params.injectMessage("Here’s your anomaly summary: In the past 24 hours, 5 anomalies were detected, including 2 high-severity incidents. You can click on any summary item to see more details.");
        }
        return "interactive_graphs";
      }
    },
    interactive_graphs: {
      message: "Do you need help navigating our interactive graphs, like zooming or filtering data?",
      path: async (params) => {
        if (params.userInput.toLowerCase().includes("zoom")) {
          await params.injectMessage("You can zoom in by scrolling your mouse wheel over the graph or by clicking and dragging to select a specific area. This lets you focus on a particular time frame or data segment.");
        }
        return "filter_anomalies";
      }
    },
    filter_anomalies: {
      message: "Would you like to filter anomalies by severity or time range?",
      path: async (params) => {
        if (params.userInput.toLowerCase().includes("high-severity")) {
          await params.injectMessage("Use the filter options on the side panel. Select ‘High’ from the severity dropdown and set the date range to last week. The graph will update to display only the filtered data.");
        }
        return "compare_sources";
      }
    },
    compare_sources: {
      message: "Are you interested in comparing multiple data sources on the same graph?",
      path: async (params) => {
        if (params.userInput.toLowerCase().includes("sensor")) {
          await params.injectMessage("Great idea! You can select multiple datasets from the data sources menu. The graph will overlay the data so you can easily compare trends and anomalies between them.");
        }
        return "real_time_alerts";
      }
    },
    real_time_alerts: {
      message: "Would you like to set up real-time alerts for anomaly spikes?",
      path: async (params) => {
        if (params.userInput.toLowerCase().includes("notified")) {
          await params.injectMessage("Click on the ‘Alerts’ icon in your dashboard. From there, you can configure real-time notifications via email or push notifications based on your selected thresholds.");
        }
        return "custom_alerts";
      }
    },
    custom_alerts: {
      message: "Do you want to customize your notification settings for live updates?",
      path: async (params) => {
        if (params.userInput.toLowerCase().includes("alert")) {
          await params.injectMessage("Head over to the settings panel, and under the ‘Alerts’ section, you can set your preferred notification method and define specific conditions that trigger alerts.");
        }
        return "ai_insights";
      }
    },
    ai_insights: {
      message: "Would you like to learn more about our AI-powered insights and predictive alerts?",
      path: async (params) => {
        if (params.userInput.toLowerCase().includes("predict")) {
          await params.injectMessage("Our AI analyzes historical data patterns along with real-time inputs to forecast potential anomaly spikes. For example, it might alert you when anomalies increase by 20% in the last 24 hours.");
        }
        return "trend_analysis";
      }
    },
    trend_analysis: {
      message: "Can I get a detailed analysis of recent anomaly trends?",
      path: async (params) => {
        if (params.userInput.toLowerCase().includes("yes")) {
          await params.injectMessage("Sure! Based on your recent data, I can show you a detailed analysis including trends over time, comparisons across different periods, and potential predictions for future anomalies. Would you like to see this as a chart or a report?");
        }
        return "access_help";
      }
    },
    access_help: {
      message: "Do you need help accessing our user guides or FAQs?",
      path: async (params) => {
        if (params.userInput.toLowerCase().includes("documentation")) {
          await params.injectMessage("You can access our comprehensive documentation by clicking on the ‘Help’ link at the bottom of the page. It includes step-by-step guides, troubleshooting tips, and FAQs.");
        }
        return "contact_support";
      }
    },
    contact_support: {
      message: "Would you like to contact support for further assistance?",
      path: async (params) => {
        if (params.userInput.toLowerCase().includes("issues")) {
          await params.injectMessage("I understand. Please click on the ‘Support’ button to chat with our live support team, or send an email to support@yourdomain.com for further assistance.");
        }
        return "collect_feedback";
      }
    },
    collect_feedback: {
      message: "Do you have any feedback or suggestions for us?",
      path: async (params) => {
        if (params.userInput.toLowerCase().includes("suggestion")) {
          await params.injectMessage("We’d love to hear your feedback! Please use our feedback form under the ‘Contact Us’ section to share your suggestions or report any issues.");
        }
        return "ask_issue";
      }
    },
    ask_issue: {
      message: "Is there any specific issue you’re facing right now?",
      function: (params) => setForm((prev) => ({ ...prev, issue: params.userInput })),
      path: "summary"
    },
    summary: {
      message: () => `Thanks ${form.name}! You're ${form.age} years old, aiming to ${form.goal}, and currently facing: ${form.issue}. Let me assist you further!`,
      options: [
        { label: "Restart", next: "start" }
      ]
    }
  };

  return (
    <>
    <ChatBot config={config} flow={flow}/>
    
      
    </>
  )
}

export default ChatBotComponent

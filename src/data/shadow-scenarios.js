export const shadowScenarios = [
  {
    id: 'daily-standup',
    title: 'Daily Standup',
    subtitle: '每日站会',
    description: '练习汇报昨天完成、今天计划和阻塞点。',
    sentences: [
      {
        id: 'standup-01',
        en: 'Yesterday I finished the API rate limiting patch.',
        zh: '昨天我完成了 API 限流补丁。',
        phrases: ['finished', 'rate limiting patch']
      },
      {
        id: 'standup-02',
        en: 'Today I will refactor the notification service.',
        zh: '今天我会重构通知服务。',
        phrases: ['refactor', 'notification service']
      },
      {
        id: 'standup-03',
        en: 'I am blocked by a flaky integration test.',
        zh: '我被一个不稳定的集成测试卡住了。',
        phrases: ['blocked by', 'flaky integration test']
      },
      {
        id: 'standup-04',
        en: 'I paired with Alice to debug the memory leak.',
        zh: '我和 Alice 结对排查了内存泄漏。',
        phrases: ['paired with', 'memory leak']
      },
      {
        id: 'standup-05',
        en: 'The fix is ready and waiting for review.',
        zh: '修复已经完成，正在等待评审。',
        phrases: ['waiting for review']
      },
      {
        id: 'standup-06',
        en: 'I will split this task into smaller tickets.',
        zh: '我会把这个任务拆成更小的工单。',
        phrases: ['split this task', 'smaller tickets']
      },
      {
        id: 'standup-07',
        en: 'I updated the sprint board before the meeting.',
        zh: '我在会议前更新了迭代看板。',
        phrases: ['updated', 'sprint board']
      },
      {
        id: 'standup-08',
        en: 'I need one more day to stabilize the feature.',
        zh: '我还需要一天来稳定这个功能。',
        phrases: ['one more day', 'stabilize the feature']
      },
      {
        id: 'standup-09',
        en: 'No blockers from my side right now.',
        zh: '我这边目前没有阻塞。',
        phrases: ['No blockers']
      },
      {
        id: 'standup-10',
        en: 'I can help with the deployment checklist this afternoon.',
        zh: '今天下午我可以帮忙处理部署清单。',
        phrases: ['deployment checklist', 'this afternoon']
      }
    ]
  },
  {
    id: 'code-review',
    title: 'Code Review',
    subtitle: '代码评审',
    description: '练习提出建议、说明风险、表达认可。',
    sentences: [
      {
        id: 'review-01',
        en: 'Could you add a unit test for this edge case?',
        zh: '你能为这个边界情况补一个单元测试吗？',
        phrases: ['unit test', 'edge case']
      },
      {
        id: 'review-02',
        en: 'The naming is clear, thanks for keeping it consistent.',
        zh: '命名很清晰，感谢你保持一致性。',
        phrases: ['naming is clear', 'consistent']
      },
      {
        id: 'review-03',
        en: 'I suggest extracting this logic into a helper function.',
        zh: '我建议把这段逻辑提取成一个辅助函数。',
        phrases: ['extracting', 'helper function']
      },
      {
        id: 'review-04',
        en: 'This change might break backward compatibility.',
        zh: '这个改动可能会破坏向后兼容。',
        phrases: ['backward compatibility']
      },
      {
        id: 'review-05',
        en: 'Can we avoid hardcoded values here?',
        zh: '这里可以避免硬编码吗？',
        phrases: ['avoid hardcoded values']
      },
      {
        id: 'review-06',
        en: 'Please add a comment explaining this workaround.',
        zh: '请加一个注释解释这个临时方案。',
        phrases: ['explaining this workaround']
      },
      {
        id: 'review-07',
        en: 'Looks good to me after the latest commit.',
        zh: '最新提交后我这边看起来没问题。',
        phrases: ['Looks good to me', 'latest commit']
      },
      {
        id: 'review-08',
        en: 'Could we simplify this conditional branch?',
        zh: '这个条件分支可以再简化吗？',
        phrases: ['simplify', 'conditional branch']
      },
      {
        id: 'review-09',
        en: 'This query needs an index to avoid a full table scan.',
        zh: '这个查询需要索引来避免全表扫描。',
        phrases: ['needs an index', 'full table scan']
      },
      {
        id: 'review-10',
        en: 'Thanks for addressing all the review comments quickly.',
        zh: '感谢你这么快处理完所有评审意见。',
        phrases: ['addressing', 'review comments']
      }
    ]
  },
  {
    id: 'slack-chat',
    title: 'Slack Chat',
    subtitle: 'Slack 日常沟通',
    description: '练习提问、同步进展、请求支持。',
    sentences: [
      {
        id: 'slack-01',
        en: 'Hey team, the staging environment is down again.',
        zh: '大家好，预发布环境又挂了。',
        phrases: ['staging environment', 'is down']
      },
      {
        id: 'slack-02',
        en: 'Could someone help me reproduce this bug?',
        zh: '有人可以帮我复现这个 bug 吗？',
        phrases: ['help me reproduce', 'this bug']
      },
      {
        id: 'slack-03',
        en: 'I pushed a hotfix, please retest when you have time.',
        zh: '我已经推了热修复，有空请再测一下。',
        phrases: ['pushed a hotfix', 'please retest']
      },
      {
        id: 'slack-04',
        en: 'I will be offline for one hour for a dentist appointment.',
        zh: '我要去看牙医，会离线一小时。',
        phrases: ['be offline', 'for one hour']
      },
      {
        id: 'slack-05',
        en: 'Can we move this thread to the backend channel?',
        zh: '这个话题可以转到后端频道吗？',
        phrases: ['move this thread', 'backend channel']
      },
      {
        id: 'slack-06',
        en: 'Thanks for the quick turnaround on this issue.',
        zh: '感谢你这么快处理这个问题。',
        phrases: ['quick turnaround']
      },
      {
        id: 'slack-07',
        en: 'I added more logs to narrow down the root cause.',
        zh: '我加了更多日志来缩小根因范围。',
        phrases: ['narrow down', 'root cause']
      },
      {
        id: 'slack-08',
        en: 'Please review the PR before end of day.',
        zh: '请在今天下班前评审这个 PR。',
        phrases: ['before end of day']
      },
      {
        id: 'slack-09',
        en: 'I am still investigating why the job is timing out.',
        zh: '我还在排查这个任务为什么超时。',
        phrases: ['still investigating', 'timing out']
      },
      {
        id: 'slack-10',
        en: 'Let us sync quickly after lunch.',
        zh: '我们午饭后快速同步一下。',
        phrases: ['sync quickly', 'after lunch']
      }
    ]
  },
  {
    id: 'email-communication',
    title: 'Email Communication',
    subtitle: '邮件沟通',
    description: '练习正式书面表达和行动项确认。',
    sentences: [
      {
        id: 'email-01',
        en: 'I am writing to follow up on the deployment timeline.',
        zh: '我写这封邮件是想跟进部署时间线。',
        phrases: ['follow up on', 'deployment timeline']
      },
      {
        id: 'email-02',
        en: 'Please find the updated report attached.',
        zh: '请查收附件中的更新报告。',
        phrases: ['Please find', 'attached']
      },
      {
        id: 'email-03',
        en: 'Could you confirm the expected delivery date?',
        zh: '你能确认一下预期交付日期吗？',
        phrases: ['confirm', 'expected delivery date']
      },
      {
        id: 'email-04',
        en: 'We identified a blocker that may impact the schedule.',
        zh: '我们发现了一个可能影响计划的阻塞项。',
        phrases: ['identified a blocker', 'impact the schedule']
      },
      {
        id: 'email-05',
        en: 'Thank you for your patience and continued support.',
        zh: '感谢你的耐心和持续支持。',
        phrases: ['continued support']
      },
      {
        id: 'email-06',
        en: 'I will share a detailed update by tomorrow morning.',
        zh: '我会在明天上午前提供详细更新。',
        phrases: ['detailed update', 'by tomorrow morning']
      },
      {
        id: 'email-07',
        en: 'Please let me know if you have any concerns.',
        zh: '如果你有任何顾虑，请告诉我。',
        phrases: ['let me know', 'any concerns']
      },
      {
        id: 'email-08',
        en: 'To summarize, we will release in two phases.',
        zh: '总结一下，我们会分两个阶段发布。',
        phrases: ['To summarize', 'in two phases']
      },
      {
        id: 'email-09',
        en: 'I have copied the security team for visibility.',
        zh: '我已抄送安全团队以便同步信息。',
        phrases: ['copied', 'for visibility']
      },
      {
        id: 'email-10',
        en: 'Sorry for the delay, we are actively working on it.',
        zh: '抱歉延迟，我们正在积极处理。',
        phrases: ['Sorry for the delay', 'actively working on it']
      }
    ]
  },
  {
    id: 'one-on-one',
    title: '1-on-1 Meeting',
    subtitle: '一对一沟通',
    description: '练习表达困难、目标和反馈请求。',
    sentences: [
      {
        id: 'oneonone-01',
        en: 'I would like feedback on my communication in meetings.',
        zh: '我想听听你对我会议沟通的反馈。',
        phrases: ['would like feedback', 'communication in meetings']
      },
      {
        id: 'oneonone-02',
        en: 'My main challenge is estimating tasks accurately.',
        zh: '我最大的挑战是更准确地评估任务。',
        phrases: ['main challenge', 'estimating tasks']
      },
      {
        id: 'oneonone-03',
        en: 'I want to take ownership of a larger feature next quarter.',
        zh: '我想在下个季度负责一个更大的功能。',
        phrases: ['take ownership', 'next quarter']
      },
      {
        id: 'oneonone-04',
        en: 'Could we align on my growth goals for this year?',
        zh: '我们可以对齐一下我今年的成长目标吗？',
        phrases: ['align on', 'growth goals']
      },
      {
        id: 'oneonone-05',
        en: 'I appreciate your support during the release pressure.',
        zh: '我很感谢你在发布压力期间给我的支持。',
        phrases: ['appreciate', 'release pressure']
      },
      {
        id: 'oneonone-06',
        en: 'I need help prioritizing conflicting requests.',
        zh: '我需要帮助来处理互相冲突的需求优先级。',
        phrases: ['prioritizing', 'conflicting requests']
      },
      {
        id: 'oneonone-07',
        en: 'Can we discuss opportunities to mentor junior developers?',
        zh: '我们能讨论一下指导初级开发者的机会吗？',
        phrases: ['mentor junior developers']
      },
      {
        id: 'oneonone-08',
        en: 'I feel more confident after the last project.',
        zh: '上个项目之后我感觉更自信了。',
        phrases: ['feel more confident']
      },
      {
        id: 'oneonone-09',
        en: 'What should I improve to reach the next level?',
        zh: '为了到达下一个级别，我应该重点提升什么？',
        phrases: ['reach the next level']
      },
      {
        id: 'oneonone-10',
        en: 'I am open to any candid feedback.',
        zh: '我愿意接受任何坦诚反馈。',
        phrases: ['open to', 'candid feedback']
      }
    ]
  },
  {
    id: 'tech-interview',
    title: 'Tech Interview',
    subtitle: '技术面试',
    description: '练习介绍项目、解释权衡与技术决策。',
    sentences: [
      {
        id: 'interview-01',
        en: 'Let me walk you through the architecture first.',
        zh: '我先带你过一下整体架构。',
        phrases: ['walk you through', 'architecture']
      },
      {
        id: 'interview-02',
        en: 'We chose Redis to reduce database load.',
        zh: '我们选择 Redis 来降低数据库压力。',
        phrases: ['chose', 'reduce database load']
      },
      {
        id: 'interview-03',
        en: 'The biggest trade-off was latency versus consistency.',
        zh: '最大的权衡是延迟和一致性之间。',
        phrases: ['biggest trade-off', 'latency versus consistency']
      },
      {
        id: 'interview-04',
        en: 'I wrote integration tests to validate the workflow.',
        zh: '我写了集成测试来验证这个流程。',
        phrases: ['integration tests', 'validate the workflow']
      },
      {
        id: 'interview-05',
        en: 'If I had more time, I would improve observability.',
        zh: '如果有更多时间，我会提升可观测性。',
        phrases: ['If I had more time', 'improve observability']
      },
      {
        id: 'interview-06',
        en: 'The incident taught me to design for failure.',
        zh: '这次事故让我学会了按失败场景做设计。',
        phrases: ['design for failure']
      },
      {
        id: 'interview-07',
        en: 'I collaborated closely with product and QA teams.',
        zh: '我和产品及 QA 团队紧密协作。',
        phrases: ['collaborated closely', 'product and QA teams']
      },
      {
        id: 'interview-08',
        en: 'This optimization reduced response time by forty percent.',
        zh: '这次优化让响应时间降低了 40%。',
        phrases: ['reduced response time']
      },
      {
        id: 'interview-09',
        en: 'I can explain the rollback strategy in more detail.',
        zh: '我可以更详细地解释回滚策略。',
        phrases: ['rollback strategy']
      },
      {
        id: 'interview-10',
        en: 'In hindsight, I would align stakeholders earlier.',
        zh: '复盘来看，我会更早和相关方对齐。',
        phrases: ['In hindsight', 'align stakeholders']
      }
    ]
  }
]

export const shadowScenarioMap = Object.fromEntries(
  shadowScenarios.map(scene => [scene.id, scene])
)

// Vercel Serverless Function - お問い合わせメール送信
// POST /api/contact

const { Resend } = require('resend');

module.exports = async function handler(req, res) {
  // CORSヘッダー
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({
      error: 'サーバー設定エラー: RESEND_API_KEY が未設定です',
    });
  }

  // 環境変数からAPIキーを取得
  const resend = new Resend(process.env.RESEND_API_KEY);

  const body =
    typeof req.body === 'string'
      ? (() => {
          try {
            return JSON.parse(req.body);
          } catch {
            return null;
          }
        })()
      : req.body;

  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'リクエスト形式が不正です' });
  }

  const { company, name, email, phone, interest, message } = body;

  // バリデーション
  if (!name || !email || !message) {
    return res.status(400).json({ error: '必須項目が入力されていません' });
  }

  // 興味のあるサービスの表示名変換
  const interestLabels = {
    chatbot: 'AIチャットボット構築',
    'internal-ai': '社内AIアシスタント構築',
    workflow: 'AIワークフロー構築',
    multiple: '複数サービスに興味がある',
    other: 'その他・相談したい',
  };

  try {
    const data = await resend.emails.send({
      from: 'Portfolio <onboarding@resend.dev>',
      to: 'minhhuypham2006@gmail.com',
      subject: `【ポートフォリオ】${company || '個人'} ${name}様からのお問い合わせ`,
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #6c63ff; border-bottom: 2px solid #6c63ff; padding-bottom: 10px;">
            📩 ポートフォリオサイトからのお問い合わせ
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 8px; font-weight: bold; color: #555; width: 140px;">会社名</td>
              <td style="padding: 12px 8px;">${company || '未入力'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 8px; font-weight: bold; color: #555;">お名前</td>
              <td style="padding: 12px 8px;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 8px; font-weight: bold; color: #555;">メールアドレス</td>
              <td style="padding: 12px 8px;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 8px; font-weight: bold; color: #555;">電話番号</td>
              <td style="padding: 12px 8px;">${phone || '未入力'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 12px 8px; font-weight: bold; color: #555;">興味のあるサービス</td>
              <td style="padding: 12px 8px;">${interestLabels[interest] || '未選択'}</td>
            </tr>
          </table>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 8px;">お問い合わせ内容</h3>
            <p style="color: #555; white-space: pre-wrap; line-height: 1.6; margin: 0;">${message}</p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            このメールはポートフォリオサイトのお問い合わせフォームから自動送信されています。
          </p>
        </div>
      `,
      replyTo: email,
    });
    
    console.log('Resend Response:', JSON.stringify(data));
    if (data.error) {
      console.error('Resend error:', JSON.stringify(data.error));
      return res.status(500).json({
        error: 'メール送信に失敗しました',
        details: data.error.message || String(data.error),
      });
    }
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Email send error:', error);
    return res.status(500).json({
      error: 'メール送信に失敗しました',
      details: error && error.message ? error.message : String(error),
    });
  }
};

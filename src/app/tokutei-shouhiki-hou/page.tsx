export default function TokuteiPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-[#18181b] px-4 py-12">
      <div className="bg-[#23272f] rounded-2xl shadow-lg p-8 max-w-2xl w-full text-gray-100">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#3881ff] mb-6">特定商取引法に基づく表記</h1>
        <dl className="space-y-4">
          <div>
            <dt className="font-bold">事業者名</dt>
            <dd>Eitan（エイタン）</dd>
          </div>
          <div>
            <dt className="font-bold">責任者</dt>
            <dd>ウィルソンルーカスエドワード</dd>
          </div>
          <div>
            <dt className="font-bold">所在地</dt>
            <dd>個人事業のため、事業用の所在地は設けておりません。所在地については、請求があった場合には遅滞なく開示いたします。</dd>
          </div>
          <div>
            <dt className="font-bold">電話番号</dt>
            <dd>個人事業のため、電話番号は公開しておりませんが、請求があった場合には遅滞なく開示いたします。</dd>
          </div>
          <div>
            <dt className="font-bold">メールアドレス</dt>
            <dd>luke@eigotankentai.com</dd>
          </div>
          <div>
            <dt className="font-bold">販売URL</dt>
            <dd><a href="https://www.eigotankentai.com/" className="text-[#3881ff] hover:underline" target="_blank" rel="noopener noreferrer">https://www.eigotankentai.com/</a></dd>
          </div>
          <div>
            <dt className="font-bold">販売価格</dt>
            <dd>各サービス紹介ページに記載された金額（税込）</dd>
          </div>
          <div>
            <dt className="font-bold">商品代金以外の必要料金</dt>
            <dd>銀行振込手数料、通信料等はお客様のご負担となります。</dd>
          </div>
          <div>
            <dt className="font-bold">お支払い方法</dt>
            <dd>クレジットカード、銀行振込、その他指定の決済手段</dd>
          </div>
          <div>
            <dt className="font-bold">代金の支払時期</dt>
            <dd>お申し込み時またはレッスン開始前までにお支払いください。</dd>
          </div>
          <div>
            <dt className="font-bold">商品の引渡時期</dt>
            <dd>予約確定後、指定日時にオンラインまたは対面で提供</dd>
          </div>
          <div>
            <dt className="font-bold">キャンセル・返金について</dt>
            <dd>レッスン開始24時間前までのキャンセルは全額返金いたします。それ以降のキャンセルは返金いたしかねます。詳細は利用規約をご確認ください。</dd>
          </div>
          <div>
            <dt className="font-bold">返品について</dt>
            <dd>商品の性質上、返品には応じられません。</dd>
          </div>
        </dl>
      </div>
    </main>
  );
}

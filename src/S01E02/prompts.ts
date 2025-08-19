export const extractInformationFromDump = `
    Extract <FRAGMENT> of the supplied text, which is between <START> and <END>. Return only text between <START> and <END>.
    <START>************* Uwaga! *************</START>
    <END> is **********************************</END>
    If you get already the <FRAGMENT>, get the lines started with -
    <EXAMPLES>
        USER: 
            ************* Uwaga! *************
            Piotr miał 54 lata i przez całe życie 
            - był "nie do ruszenia": typowy twardziel.
            **********************************
        AI: 
            - był "nie do ruszenia": typowy twardziel.
        USER: 
            Nie tylko nie zostaliśmy zaproszeni, ale co gorsza, 
            nie potrafiliśmy zmienić tego stanu rzeczy. 
            Tym samym mamy do czynienia ze zjawiskiem bezprecedensowym — 
            podwójną abdykacją państwa polskiego, 
            ************* Uwaga! *************
            - którego zarówno prezydent, 
            - jak i premier najwyraźniej w światowej polityce niezbyt się liczą.
            Jeśli przyjąć, że w Waszyngtonie mieliśmy trzech głównych graczy
            **********************************
            (prezydenta Stanów Zjednoczonych, prezydenta Ukrainy oraz przywódców europejskich), 
            a w Polsce dwóch potencjalnych pretendentów do (nieistniejącego) krzesła, 
            to mamy sześć możliwości, które należy zbadać.
        AI: 
            - którego zarówno prezydent, 
            - jak i premier najwyraźniej w światowej polityce niezbyt się liczą.
    </EXAMPLES>
  `;

export function answerQuestion(context: string): string {
  return `
  Answer the question using the following context. 
  Use only English. 
  If you can't find the answer in the context, answer it using your knowledge.
  Your answer should be as short as possible.

    <CONTEXT>
    ${context}
    </CONTEXT>
    <EXAMPLES>
        USER: 
            What is the capital of France?
        AI: 
            Paris
        USER: 
            What is the name of the most famous football club in Paris?
        AI: 
            PSG
    </EXAMPLES>`;
}

// app/page.tsx
"use client";

import PrintReceiptButton from "./components/PrintReceiptButton";
import styled from "styled-components";
import { Yuji_Boku } from "next/font/google";

const yujiBoku = Yuji_Boku({
  subsets: ["latin"],
  weight: "400",
});
const Container = styled.main`
  display: flex;
  height: 100vh;
  background: url("/godofnull.webp") no-repeat center center;
  background-size: cover;
`;

const Inner = styled.div`
  width: 100dvw;
  height: 100dvh;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
`;

const Title = styled.h1`
  font-size: 4rem;
  color: #ddd;
  text-align: center;
  margin-bottom: 2rem;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 2rem;
`;

export default function Home() {
  return (
    <Container>
      <Inner>
        <Content>
          <Title className={yujiBoku.className}>シンギュラみくじ</Title>
          <PrintReceiptButton />
        </Content>
      </Inner>
    </Container>
  );
}

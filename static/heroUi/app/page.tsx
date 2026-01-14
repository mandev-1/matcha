import { title } from "@/components/primitives";

export default function Home() {
  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-4xl text-center justify-center">
        <p className={title({ class: "text-2xl md:text-4xl" })}>
          This project aims to create a dating website. We set out to develop an application that facilitates connections between two potential kindred spirits, covering their entire life-changing entwinement from registration on our platform to the final meeting.
        </p>
      </div>
    </section>
  );
}

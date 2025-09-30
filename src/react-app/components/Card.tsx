interface CardProps {
  title?: string;
  children: React.ReactNode;
}

export default function Card({ title, children }: CardProps) {
  return (
    <div className="neo-brutalist bg-white p-4 sm:p-6 lg:p-8">
      {title && <h3 className="text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4">{title}</h3>}
      {children}
    </div>
  );
}
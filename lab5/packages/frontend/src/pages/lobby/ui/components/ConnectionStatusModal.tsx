interface ConnectionStatusModalProps {
  title: string;
  message: string;
}

export function ConnectionStatusModal({ title, message }: ConnectionStatusModalProps) {
  return (
    <div className="connection-modal" role="alert">
      <div className="connection-modal__content">
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
    </div>
  );
}

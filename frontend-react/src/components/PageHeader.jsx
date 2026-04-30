export default function PageHeader({ eyebrow = "Module", title, description, extra }) {
  return (
    <div className="page-toolbar">
      <div>
        <p className="page-eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-copy">{description}</p> : null}
      </div>
      {extra}
    </div>
  );
}

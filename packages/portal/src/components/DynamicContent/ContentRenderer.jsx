import styles from './content_renderer.module.scss';
import sanitize from 'sanitize-html';

export default function ContentRenderer({ text }) {
    const sanitizedHtml = sanitize(text, {
        allowedTags: false,
        allowedAttributes: false,
        parseStyleAttributes: false,
    });

    return (
        <div className='app-container'>
            <div className={styles.content_wrapper}>
                <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} className={'ck-content'} />
            </div>
        </div>
    );
}
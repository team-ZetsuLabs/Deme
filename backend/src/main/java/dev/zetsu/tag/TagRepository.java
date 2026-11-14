package dev.zetsu.tag;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface TagRepository extends JpaRepository<Tag, Long> {

    List<Tag> findByNameIn(Collection<String> names);

    interface TagCount {
        String getName();

        long getQuestionCount();
    }

    @Query(value = """
            select t.name as name, count(qt.question_id) as questionCount
            from tags t left join question_tags qt on qt.tag_id = t.id
            where (:prefix = '' or t.name like :prefix || '%')
            group by t.name
            order by count(qt.question_id) desc, t.name
            limit :limit
            """, nativeQuery = true)
    List<TagCount> popular(String prefix, int limit);
}

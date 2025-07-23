import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function addStudentToSupabase({ userId, name, age, grade_level, english_ability, notes }: {
  userId: string;
  name: string;
  age: string | number;
  grade_level: string;
  english_ability: string;
  notes: string;
}) {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from('students')
    .insert({
      parent_id: userId,
      name: name.trim(),
      age: age ? parseInt(age.toString()) : null,
      grade_level,
      english_ability,
      notes: notes.trim(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
